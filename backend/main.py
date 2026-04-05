import os
import json
import base64
import traceback
import requests as http_requests
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from pydantic import BaseModel
from datetime import date, timedelta, datetime

# ============================================================
# GEMINI CONFIG — Using REST API directly (most reliable)
# ============================================================
GEMINI_API_KEY = "AIzaSyC8eWa3zYWbgNNLwVRmXE2wyg6JDY0b5hw"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

app = FastAPI(title="ARVIK Backend API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FB_DB_URL = "https://avdhi-a3205-default-rtdb.firebaseio.com"


def call_gemini_vision(file_bytes: bytes, mime_type: str, prompt: str) -> str:
    """Call Gemini REST API with an image/pdf and a text prompt. Returns raw text."""
    b64_data = base64.b64encode(file_bytes).decode("utf-8")

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": b64_data
                        }
                    },
                    {
                        "text": prompt
                    }
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048
        }
    }

    resp = http_requests.post(GEMINI_URL, json=payload, timeout=60)
    print(f"[GEMINI] Status: {resp.status_code}")

    if resp.status_code != 200:
        print(f"[GEMINI] Error body: {resp.text}")
        raise Exception(f"Gemini API returned {resp.status_code}: {resp.text[:500]}")

    result = resp.json()
    # Extract text from response
    candidates = result.get("candidates", [])
    if not candidates:
        raise Exception(f"No candidates in Gemini response: {json.dumps(result)[:500]}")

    text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
    print(f"[GEMINI] Raw response text: {text[:500]}")
    return text


def call_gemini_text(prompt: str) -> str:
    """Call Gemini REST API with a text-only prompt."""
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 1024}
    }
    resp = http_requests.post(GEMINI_URL, json=payload, timeout=30)
    if resp.status_code != 200:
        raise Exception(f"Gemini text API error: {resp.status_code}")
    result = resp.json()
    return result["candidates"][0]["content"]["parts"][0]["text"]


def parse_json_from_text(text: str) -> dict:
    """Robustly extract JSON from Gemini's response text."""
    text = text.strip()
    # Remove markdown code fences
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()

    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try finding JSON object in text
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass

    return None


# ============================================================
# 1. AI DOCUMENT ENGINE & SALDO
# ============================================================
@app.post("/upload")
async def process_document(
    file: UploadFile = File(...),
    client_id: str = Form(...),
    doc_type: str = Form(...)
):
    contents = await file.read()
    mime = file.content_type or "application/octet-stream"

    print(f"\n{'='*60}")
    print(f"[UPLOAD] File: {file.filename}, Size: {len(contents)} bytes, MIME: {mime}")
    print(f"[UPLOAD] Client: {client_id}, Type: {doc_type}")

    # For PDFs, Gemini 1.5 Flash handles them natively via inline_data
    # For images, same approach works
    # Supported: image/png, image/jpeg, image/webp, image/gif, application/pdf

    prompt = """You are an expert financial document analyzer. Look at this document very carefully.

Extract these fields from the document:
1. GSTIN (GST Identification Number - 15 character alphanumeric)
2. Invoice Number
3. Invoice Date (in YYYY-MM-DD format)
4. Total Amount (the final total, as a number without currency symbols)
5. Vendor/Company Name (the company that issued this invoice)

IMPORTANT RULES:
- Look at EVERY part of the document carefully
- For amount, use the TOTAL/Grand Total/Final amount
- For vendor, use the company name at the TOP of the invoice (the seller)
- If a field is not found, put "Not Found" instead of empty string
- Return ONLY a JSON object, no other text

Return exactly this JSON format:
{"gstin": "value", "invoice_number": "value", "date": "value", "amount": "value", "vendor": "value"}"""

    extracted_data = None
    raw_text = ""

    try:
        raw_text = call_gemini_vision(contents, mime, prompt)
        extracted_data = parse_json_from_text(raw_text)

        if not extracted_data:
            print(f"[PARSE] Failed to parse JSON from: {raw_text[:300]}")
            extracted_data = {
                "gstin": "Not Found",
                "invoice_number": "Not Found",
                "date": "Not Found",
                "amount": "0",
                "vendor": "Not Found",
                "parse_error": "Could not parse Gemini response as JSON",
                "raw_response": raw_text[:500]
            }
    except Exception as e:
        print(f"[ERROR] Gemini call failed: {str(e)}")
        traceback.print_exc()
        extracted_data = {
            "gstin": "Not Found",
            "invoice_number": "Not Found",
            "date": "Not Found",
            "amount": "0",
            "vendor": "Not Found",
            "error_msg": str(e)[:300],
            "raw_text_fallback": raw_text[:300] if raw_text else ""
        }

    print(f"[RESULT] Extracted: {json.dumps(extracted_data, indent=2)}")

    # Normalize numeric amount
    try:
        amount_str = str(extracted_data.get("amount", "0"))
        amount_str = amount_str.replace(',', '').replace('₹', '').replace('Rs', '').replace('.', '', amount_str.count('.') - 1 if amount_str.count('.') > 1 else 0).strip()
        amount = float(amount_str) if amount_str and amount_str != "Not Found" else 0.0
    except:
        amount = 0.0

    extracted_data["amount"] = amount

    # Save Document Reference in Firebase
    doc_payload = {
        "client_id": client_id,
        "type": doc_type,
        "extracted_data": extracted_data,
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    }
    http_requests.post(f"{FB_DB_URL}/documents.json", json=doc_payload)

    # Track Financial Balance - SALDO System Update
    saldo_url = f"{FB_DB_URL}/saldo/{client_id}.json"
    res = http_requests.get(saldo_url)
    saldo = res.json() if res.status_code == 200 and res.json() else {"total_inflow": 0, "total_outflow": 0, "balance": 0}

    if doc_type.lower() == 'sales':
        saldo['total_inflow'] += amount
    else:
        saldo['total_outflow'] += amount

    saldo['balance'] = saldo['total_inflow'] - saldo['total_outflow']
    http_requests.put(saldo_url, json=saldo)

    print(f"[SALDO] Updated: {saldo}")
    print(f"{'='*60}\n")

    return {"message": "Document processed and SALDO updated", "data": extracted_data, "saldo": saldo}


# ============================================================
# SALDO INSIGHT
# ============================================================
class InsightRequest(BaseModel):
    client_id: str

@app.post("/saldo-insight")
async def get_saldo_insight(req: InsightRequest):
    saldo_url = f"{FB_DB_URL}/saldo/{req.client_id}.json"
    res = http_requests.get(saldo_url)
    saldo_data = res.json()

    if not saldo_data:
        return {"insight": "No financial records found. Upload documents to generate SALDO."}

    prompt = f"""Analyze this financial data and give insights:
Total income: ₹{saldo_data.get('total_inflow', 0)}
Total expenses: ₹{saldo_data.get('total_outflow', 0)}
Overall Balance: ₹{saldo_data.get('balance', 0)}

Provide:
- Total income summary
- Total expenses summary
- Possible risk
- Suggestions

Keep it concise and business-focused. No markdown code blocks."""

    try:
        insight = call_gemini_text(prompt)
    except Exception as e:
        print(f"[INSIGHT ERROR] {e}")
        insight = "AI Insights temporarily unavailable."

    return {"saldo": saldo_data, "insight": insight}


# ============================================================
# 2. DEMO ALERT SYSTEM (Fast: every 90 seconds)
# ============================================================
import random

DEMO_ALERTS = [
    "⚠️ GST Return GSTR-3B due soon! File before deadline.",
    "📋 TDS Form 26Q pending submission.",
    "🔔 GST Annual Return GSTR-9 filing window closing.",
    "⏰ GSTR-1 due date approaching. Prepare invoices.",
    "📊 Quarterly compliance review required.",
    "⚠️ PF/ESI return filing reminder.",
    "🔴 Income Tax advance payment due this quarter.",
    "📝 ROC Annual Filing (AOC-4) deadline near.",
    "⚠️ GST Input Tax Credit reconciliation pending.",
    "🔔 Professional Tax payment due this month.",
]

def run_demo_alert_scheduler():
    """Fast demo alerts every 90 seconds for impressive demo."""
    print("[DEMO ALERT] Running fast demo alert scheduler...")
    
    # Get all clients and their assigned CAs
    res = http_requests.get(f"{FB_DB_URL}/clients.json")
    if res.status_code != 200 or not res.json(): 
        print("[DEMO ALERT] No clients found, skipping.")
        return
    
    clients = res.json()
    alert_msg = random.choice(DEMO_ALERTS)
    
    for client_id, c_data in clients.items():
        ca_uid = c_data.get("assigned_ca_uid")
        if not ca_uid: continue
        
        # 50% chance to generate alert for each client (to avoid flooding)
        if random.random() > 0.5: continue
        
        # Alert for CA
        ca_alert = {
            "target_uid": ca_uid,
            "message": f"{alert_msg} (Client: {c_data.get('name', 'Unknown')})",
            "client_name": c_data.get("name", ""),
            "type": "warning",
            "created_at": datetime.utcnow().isoformat(),
            "read": False
        }
        http_requests.post(f"{FB_DB_URL}/alerts.json", json=ca_alert)
        
        # Alert for Client too
        client_alert = {
            "target_uid": client_id,
            "message": alert_msg,
            "client_name": c_data.get("name", ""),
            "type": "warning",
            "created_at": datetime.utcnow().isoformat(),
            "read": False
        }
        http_requests.post(f"{FB_DB_URL}/alerts.json", json=client_alert)
        
        print(f"[DEMO ALERT] Sent: {alert_msg} → CA:{ca_uid} + Client:{client_id}")

# Scheduler Instance — runs every 90 seconds for demo
scheduler = BackgroundScheduler()
scheduler.add_job(run_demo_alert_scheduler, 'interval', seconds=90)
scheduler.start()
print("[SCHEDULER] Demo alert scheduler started (every 90s)")

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()

@app.get("/trigger-scheduler")
def manual_trigger():
    run_demo_alert_scheduler()
    return {"message": "Demo alerts triggered successfully"}

@app.get("/")
def read_root():
    return {"status": "ARVIK Master Backend Alive", "gemini_enabled": bool(GEMINI_API_KEY)}

