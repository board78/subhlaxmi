export type QpcDeepLink = {
  upi_intent?: string;
  upi_phonepe?: string;
  upi_gpay?: string;
  upi_paytm?: string;
};

export type QpcCreateData = {
  paymentLink?: string;
  paymentPageUrl?: string;
  paymentUrl?: string;
  paymentImage?: string | null;
  platOrderNo?: string;
  orderStatus?: string;
  payAmount?: number;
  deepLink?: QpcDeepLink;
};

export type QpcCreateResponse = {
  status?: string | number;
  message?: string;
  data?: QpcCreateData;
  cloudflare_error?: boolean;
  title?: string;
  detail?: string;
};

export type QpcPayinStatusData = {
  merchantOrderNo?: string;
  platOrderNo?: string;
  utr?: string;
  amount?: number;
  merchantFee?: number;
  orderStatus?: string;
  status?: string;
  orderMessage?: string;
  deepLink?: QpcDeepLink;
  paymentLink?: string;
};

export type QpcPayerInput = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};
