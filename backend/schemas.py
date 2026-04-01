from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import date, datetime
import enum

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CA = "ca"
    CLIENT = "client"

class ComplianceType(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        orm_mode = True

class ComplianceBase(BaseModel):
    name: str
    due_day: int
    type: ComplianceType
    category: str

class ComplianceCreate(ComplianceBase):
    pass

class Compliance(ComplianceBase):
    id: int
    class Config:
        orm_mode = True

class ClientComplianceBase(BaseModel):
    client_id: int
    compliance_id: int
    last_filed_on: Optional[date] = None
    status: str = "pending"

class ClientCompliance(ClientComplianceBase):
    id: int
    compliance: Optional[Compliance] = None
    class Config:
        orm_mode = True

class ClientBase(BaseModel):
    name: str
    gstin: str
    assigned_ca_id: Optional[int] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    ca: Optional[User] = None
    compliances: List[ClientCompliance] = []
    class Config:
        orm_mode = True

class AlertBase(BaseModel):
    user_id: int
    message: str

class Alert(AlertBase):
    id: int
    created_at: datetime
    is_read: bool
    class Config:
        orm_mode = True
