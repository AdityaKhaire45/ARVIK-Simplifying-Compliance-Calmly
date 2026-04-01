from datetime import date, timedelta, datetime
from sqlalchemy.orm import Session
from database import SessionLocal
import models

def calculate_next_due_date(current_date: date, due_day: int, compliance_type: models.ComplianceType):
    """Simple logic: If today is 1st April and due day is 11th, next due date is 11th April."""
    if compliance_type == models.ComplianceType.MONTHLY:
        # If today's day is <= due_day, same month, else next month.
        if current_date.day <= due_day:
            return date(current_date.year, current_date.month, due_day)
        else:
            # Shift to next month
            next_month = current_date.month + 1
            year = current_date.year
            if next_month > 12:
                next_month = 1
                year += 1
            return date(year, next_month, due_day)
    elif compliance_type == models.ComplianceType.YEARLY:
        # Yearly logic: Assuming due_day is encoded (e.g. 150 = 150th day of year)
        # Simplified for now: Assume due_day is Day of year
        current_day_of_year = current_date.timetuple().tm_yday
        if current_day_of_year <= due_day:
            return date(current_date.year, 1, 1) + timedelta(days=due_day - 1)
        else:
            return date(current_date.year + 1, 1, 1) + timedelta(days=due_day - 1)
    return None

def check_and_alert():
    db: Session = SessionLocal()
    today = date.today()
    threshold = 3 # Alert 3 days before
    
    # Logic:
    # 1. Get all client compliances.
    # 2. Get the compliance definition (due_day, type).
    # 3. Calculate next due date.
    # 4. If tomorrow - today <= threshold, create alert for CA and Client.
    
    compliances = db.query(models.ClientCompliance).filter(models.ClientCompliance.status != "filed").all()
    
    for cc in compliances:
        comp_def = db.query(models.Compliance).filter(models.Compliance.id == cc.compliance_id).first()
        next_due = calculate_next_due_date(today, comp_def.due_day, comp_def.type)
        
        if next_due:
            days_remaining = (next_due - today).days
            
            if 0 <= days_remaining <= threshold:
                client = db.query(models.Client).filter(models.Client.id == cc.client_id).first()
                if not client: continue
                
                msg = f"Upcoming Due: {comp_def.name} for {client.name} on {next_due}"
                
                # Check for existing alert to avoid duplicates
                existing_alert = db.query(models.Alert).filter(
                    models.Alert.user_id == client.assigned_ca_id,
                    models.Alert.message.contains(f"{comp_def.name} for {client.name}")
                ).first()
                
                if not existing_alert:
                    # Alert CA
                    ca_alert = models.Alert(user_id=client.assigned_ca_id, message=msg)
                    db.add(ca_alert)
                    # Alert Client (in real scenario, we'd have a User ID for Client)
                    # db.add(models.Alert(user_id=client.user_id, message=msg))
    
    db.commit()
    db.close()
