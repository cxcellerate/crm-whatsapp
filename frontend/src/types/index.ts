export type Role = 'ADMIN' | 'MANAGER' | 'SELLER';
export type LeadSource = 'MANUAL' | 'FORM' | 'WHATSAPP' | 'GOOGLE_ADS' | 'META_ADS' | 'ORGANIC' | 'REFERRAL';
export type MessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'TEMPLATE';
export type Direction = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export type ActivityType = 'NOTE' | 'STAGE_CHANGE' | 'MESSAGE_SENT' | 'MESSAGE_RECEIVED' | 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface Pipeline {
  id: string;
  name: string;
  order: number;
  color: string;
  stages: Stage[];
  createdAt: string;
}

export interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  pipelineId: string;
  _count?: { leads: number };
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  value?: number;
  notes?: string;
  stageId: string;
  stage: Stage & { pipeline: Pipeline };
  assignedTo?: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  source: LeadSource;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  tags: string[];
  lostReason?: string;
  wonAt?: string;
  lostAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
  messages?: Message[];
  activities?: Activity[];
}

export interface Message {
  id: string;
  leadId: string;
  userId?: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  content: string;
  type: MessageType;
  direction: Direction;
  status: MessageStatus;
  waMessageId?: string;
  mediaUrl?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  leadId: string;
  userId?: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  type: ActivityType;
  content: string;
  createdAt: string;
}

export interface FormCapture {
  id: string;
  name: string;
  token: string;
  pipelineId?: string;
  stageId?: string;
  assignTo?: string;
  active: boolean;
  createdAt: string;
}
