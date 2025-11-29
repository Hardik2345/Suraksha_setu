// ============================================================================
// Suraksha Setu - TypeScript Types (Based on Backend Swagger/OpenAPI)
// ============================================================================

// ---------------------- User Types ----------------------
export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'admin';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  createdAt?: string;
  isActive?: boolean;
}

export interface LoginRequest {
  username: string; // Can be email or username
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'citizen' | 'admin';
  };
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone?: string;
  role?: 'citizen' | 'admin';
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ProfileResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'citizen' | 'admin';
  };
}

// ---------------------- SOS Types ----------------------
export type SOSType = 'flood' | 'fire' | 'earthquake' | 'medical' | 'accident' | 'other';
export type SOSSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SOSStatus = 'pending' | 'acknowledged' | 'in-progress' | 'resolved';

export interface SOSLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface SOS {
  _id: string;
  userId: User | string;
  type: SOSType;
  severity: SOSSeverity;
  status: SOSStatus;
  description: string;
  location: SOSLocation;
  contactNumber?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export interface CreateSOSRequest {
  type: SOSType;
  description: string;
  location: SOSLocation;
  severity?: SOSSeverity;
  contactNumber?: string;
}

export interface CreateSOSResponse {
  success: boolean;
  data: SOS;
}

export interface SOSListResponse {
  success: boolean;
  data: SOS[];
}

export interface SOSDetailResponse {
  success: boolean;
  data: SOS;
}

export interface UpdateSOSStatusRequest {
  status?: SOSStatus;
  adminNotes?: string;
}

export interface SOSListParams {
  status?: SOSStatus;
}

// ---------------------- Resource Types ----------------------
export type ResourceType = 
  | 'hospital' 
  | 'shelter' 
  | 'fire-station' 
  | 'police-station' 
  | 'community-center' 
  | 'relief-camp';

export interface ResourceLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ResourceContact {
  phone: string;
  email?: string;
  website?: string;
}

export interface Resource {
  _id: string;
  name: string;
  type: ResourceType;
  location: ResourceLocation;
  contact: ResourceContact;
  services?: string[];
  capacity?: number;
  currentOccupancy?: number;
  operatingHours?: string;
  isActive: boolean;
  createdBy?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceListParams {
  type?: ResourceType;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

export interface ResourceListResponse {
  success: boolean;
  count: number;
  data: Resource[];
}

export interface ResourceDetailResponse {
  success: boolean;
  data: Resource;
}

export interface CreateResourceRequest {
  name: string;
  type: ResourceType;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat: number;
  lng: number;
  phone: string;
  email?: string;
  website?: string;
  services?: string[];
  capacity?: number;
  operatingHours?: string;
}

export interface UpdateResourceRequest {
  name?: string;
  type?: ResourceType;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  capacity?: number;
  currentOccupancy?: number;
  operatingHours?: string;
  isActive?: boolean;
}

// ---------------------- Alert Types ----------------------
export type AlertSeverity = 'info' | 'warning' | 'danger' | 'critical';
export type AlertType = 'weather' | 'disaster' | 'health' | 'security' | 'general';
export type AlertTargetAudience = 'all' | 'location-based' | 'admin-only';

export interface AlertLocation {
  type: 'Point';
  coordinates: [number, number];
  radius?: number;
  city?: string;
  state?: string;
}

export interface Alert {
  _id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  targetAudience: AlertTargetAudience;
  location?: AlertLocation;
  isActive: boolean;
  createdBy: User | string;
  createdAt: string;
  expiresAt: string;
  readBy?: string[];
}

export interface AlertListResponse {
  success: boolean;
  count: number;
  data: Alert[];
}

export interface CreateAlertRequest {
  title: string;
  message: string;
  type: AlertType;
  severity?: AlertSeverity;
  targetAudience?: AlertTargetAudience;
  lat?: number;
  lng?: number;
  radius?: number;
  city?: string;
  state?: string;
  expiryHours?: number;
  location?: AlertLocation;
}

export interface CreateAlertResponse {
  success: boolean;
  message: string;
  data: Alert;
}

// ---------------------- Dashboard Types ----------------------
export interface CitizenDashboardResponse {
  success: boolean;
  data: {
    recentSOS: SOS[];
    stats: {
      total: number;
      pending: number;
      resolved: number;
    };
  };
}

export interface AdminDashboardResponse {
  success: boolean;
  data: {
    total: number;
    statuses: Array<{ _id: SOSStatus; count: number }>;
    severities: Array<{ _id: SOSSeverity; count: number }>;
    pendingList: SOS[];
  };
}

// ---------------------- Common API Types ----------------------
export interface ApiError {
  message: string;
  success?: boolean;
}

export interface SuccessResponse {
  success: boolean;
  message: string;
}


