import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Boolean, Date
from sqlalchemy.orm import relationship
from database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    CA = "ca"
    CLIENT = "client"

class ComplianceType(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole), default=UserRole.CA)
    hashed_password = Column(String) # For now, simple.
    
    clients = relationship("Client", back_populates="ca", foreign_keys="Client.assigned_ca_id")

class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    gstin = Column(String, unique=True)
    assigned_ca_id = Column(Integer, ForeignKey("users.id"))
    
    ca = relationship("User", back_populates="clients", foreign_keys=[assigned_ca_id])
    compliances = relationship("ClientCompliance", back_populates="client")

class Compliance(Base):
    __tablename__ = "compliances"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    due_day = Column(Integer) # Day of the month or specific day of year logic
    type = Column(Enum(ComplianceType))
    category = Column(String) # GST, TDS, PF, etc.

class ClientCompliance(Base):
    __tablename__ = "client_compliances"
    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"))
    compliance_id = Column(Integer, ForeignKey("compliances.id"))
    last_filed_on = Column(Date, nullable=True)
    status = Column(String, default="pending") # pending, overdue, filed
    
    client = relationship("Client", back_populates="compliances")
    compliance = relationship("Compliance")

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
