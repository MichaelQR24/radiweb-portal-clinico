export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  ip_address: string;
  timestamp: Date;
  // Campos JOIN opcionales
  user_name?: string;
  user_email?: string;
}
