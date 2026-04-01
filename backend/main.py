from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi.middleware.cors import CORSMiddleware
import models, schemas, database
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Avdhi Compliance API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev only
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def seed_data():
    db = database.SessionLocal()
    # 1. Seed CAs if none
    if db.query(models.User).filter(models.User.role == models.UserRole.CA).count() == 0:
        mahek = models.User(name="Mahek CA", email="mahek@avdhi.com", role=models.UserRole.CA, hashed_password="password")
        aditya = models.User(name="Aditya CA", email="aditya@avdhi.com", role=models.UserRole.CA, hashed_password="password")
        db.add_all([mahek, aditya])
    
    # 2. Seed Compliances if none
    if db.query(models.Compliance).count() == 0:
        comps = [
            models.Compliance(name="GSTR-1", due_day=11, type=models.ComplianceType.MONTHLY, category="GST"),
            models.Compliance(name="GSTR-3B", due_day=20, type=models.ComplianceType.MONTHLY, category="GST"),
            models.Compliance(name="TDS Payment", due_day=7, type=models.ComplianceType.MONTHLY, category="TDS"),
            models.Compliance(name="PF & ESIC", due_day=15, type=models.ComplianceType.MONTHLY, category="Payroll"),
            models.Compliance(name="Professional Tax", due_day=30, type=models.ComplianceType.MONTHLY, category="PT"),
        ]
        db.add_all(comps)
    
    db.commit()
    db.close()

@app.get("/")
def read_root():
    return {"message": "Welcome to Avdhi Compliance API"}

# USER ENDPOINTS
@app.get("/cas/", response_model=List[schemas.User])
def read_cas(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == models.UserRole.CA).all()

@app.get("/users/", response_model=List[schemas.User])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@app.post("/users/", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Basic existence check
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # In a real app, hash the password
    new_user = models.User(
        name=user.name,
        email=user.email,
        role=user.role,
        hashed_password=user.password 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# CLIENT ENDPOINTS
@app.get("/clients/", response_model=List[schemas.Client])
def read_clients(db: Session = Depends(get_db)):
    return db.query(models.Client).all()

@app.post("/add-client")
def add_client(client_data: dict, db: Session = Depends(get_db)):
    # client_data format: { name, gstin, assigned_ca_id, compliances: ["GST-1", "GST-3B"] }
    new_client = models.Client(
        name=client_data.get("name"),
        gstin=client_data.get("gstin"),
        assigned_ca_id=client_data.get("assigned_ca_id")
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    
    # Assign compliances
    comp_names = client_data.get("compliances", [])
    for c_name in comp_names:
        # Find compliance by name or create if doesn't exist
        comp = db.query(models.Compliance).filter(models.Compliance.name == c_name).first()
        if not comp:
            comp = models.Compliance(name=c_name, due_day=20, type=models.ComplianceType.MONTHLY, category="General")
            db.add(comp)
            db.commit()
            db.refresh(comp)
        
        cc = models.ClientCompliance(client_id=new_client.id, compliance_id=comp.id)
        db.add(cc)
    
    db.commit()
    return {"message": "Client added", "client": new_client}

@app.put("/clients/{client_id}/reassign", response_model=schemas.Client)
def reassign_client(client_id: int, ca_id: int, db: Session = Depends(get_db)):
    db_client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    db_client.assigned_ca_id = ca_id
    db.commit()
    db.refresh(db_client)
    return db_client

# COMPLIANCE ENDPOINTS
@app.get("/compliances/", response_model=List[schemas.Compliance])
def read_compliances(db: Session = Depends(get_db)):
    return db.query(models.Compliance).all()

@app.post("/compliances/", response_model=schemas.Compliance)
def create_compliance(compliance: schemas.ComplianceCreate, db: Session = Depends(get_db)):
    new_comp = models.Compliance(
        name=compliance.name,
        due_day=compliance.due_day,
        type=compliance.type,
        category=compliance.category
    )
    db.add(new_comp)
    db.commit()
    db.refresh(new_comp)
    return new_comp

# ALERT ENDPOINTS
@app.get("/alerts/{user_id}", response_model=List[schemas.Alert])
def read_alerts(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Alert).filter(models.Alert.user_id == user_id).order_by(models.Alert.created_at.desc()).all()
