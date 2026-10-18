# backend/modulos/sync/models.py
import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class SyncQueue(Base):
    __tablename__ = "sync_queue"
    id = Column(Integer, primary_key=True, autoincrement=True)
    sql_statement = Column(Text, nullable=False)
    params = Column(Text, nullable=True)  # JSON serializado
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(20), default="PENDING")  # PENDING, FAILED, COMPLETED
    retries = Column(Integer, default=0)
