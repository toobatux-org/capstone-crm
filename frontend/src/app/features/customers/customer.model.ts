export interface Customer {
  publicId: string;
  fullName: string;
  status: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  status: string;
}

export interface CustomerPage {
  content: Customer[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
