// lib/quickbooks/client.ts
import axios from "axios";

interface QuickBooksConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: "sandbox" | "production";
  realmId?: string;
  accessToken?: string;
  refreshToken?: string;
}

class QuickBooksClient {
  private config: QuickBooksConfig;
  private baseUrl: string;
  private authUrl: string;

  constructor(config: QuickBooksConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";
    this.authUrl = "https://oauth.platform.intuit.com";
  }

  // Generate authorization URL for user to connect QuickBooks
  getAuthorizationUrl(state: string = "random_state"): string {
    const scopes = "com.intuit.quickbooks.accounting";
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      response_type: "code",
      scope: scopes,
      redirect_uri: this.config.redirectUri,
      state: state,
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async getTokens(authorizationCode: string, realmId: string) {
    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const response = await axios.post(
      `${this.authUrl}/oauth2/v1/tokens/bearer`,
      new URLSearchParams({
        grant_type: "authorization_code",
        code: authorizationCode,
        redirect_uri: this.config.redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      },
    );

    this.config.accessToken = response.data.access_token;
    this.config.refreshToken = response.data.refresh_token;
    this.config.realmId = realmId;

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      realmId: realmId,
      expiresIn: response.data.expires_in,
    };
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.config.refreshToken) {
      throw new Error("No refresh token available");
    }

    const auth = Buffer.from(
      `${this.config.clientId}:${this.config.clientSecret}`,
    ).toString("base64");

    const response = await axios.post(
      `${this.authUrl}/oauth2/v1/tokens/bearer`,
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: this.config.refreshToken,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      },
    );

    this.config.accessToken = response.data.access_token;
    this.config.refreshToken = response.data.refresh_token;

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }
  //@ts-ignore
  // Make API request with automatic token refresh
  private async makeRequest(method: string, endpoint: string, data?: any) {
    if (!this.config.accessToken || !this.config.realmId) {
      throw new Error("QuickBooks not connected. Please authorize first.");
    }

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}/v3/company/${this.config.realmId}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      // If token expired, refresh and retry
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        return this.makeRequest(method, endpoint, data);
      }
      throw error;
    }
  }

  // ========================================
  // CUSTOMER OPERATIONS
  // ========================================

  async createCustomer(customerData: {
    displayName: string;
    givenName?: string;
    familyName?: string;
    companyName?: string;
    primaryPhone?: string;
    primaryEmailAddr?: string;
    billAddr?: {
      line1?: string;
      city?: string;
      countrySubDivisionCode?: string;
      postalCode?: string;
    };
  }) {
    return this.makeRequest("POST", "/customer", {
      DisplayName: customerData.displayName,
      GivenName: customerData.givenName,
      FamilyName: customerData.familyName,
      CompanyName: customerData.companyName,
      PrimaryPhone: customerData.primaryPhone
        ? { FreeFormNumber: customerData.primaryPhone }
        : undefined,
      PrimaryEmailAddr: customerData.primaryEmailAddr
        ? { Address: customerData.primaryEmailAddr }
        : undefined,
      BillAddr: customerData.billAddr,
    });
  }

  async getCustomer(customerId: string) {
    return this.makeRequest("GET", `/customer/${customerId}`);
  }

  // ========================================
  // ITEM (PRODUCT) OPERATIONS
  // ========================================

  async createItem(itemData: {
    name: string;
    description?: string;
    type: "Inventory" | "Service" | "NonInventory";
    unitPrice: number;
    purchaseCost?: number;
    qtyOnHand?: number;
    incomeAccountRef?: string;
    assetAccountRef?: string;
    expenseAccountRef?: string;
  }) {
    const itemPayload: any = {
      Name: itemData.name,
      Description: itemData.description,
      Type: itemData.type,
      IncomeAccountRef: itemData.incomeAccountRef
        ? { value: itemData.incomeAccountRef }
        : { value: "1" }, // Default income account
    };

    if (itemData.type === "Inventory") {
      itemPayload.TrackQtyOnHand = true;
      itemPayload.QtyOnHand = itemData.qtyOnHand || 0;
      itemPayload.InvStartDate = new Date().toISOString().split("T")[0];
      itemPayload.AssetAccountRef = itemData.assetAccountRef
        ? { value: itemData.assetAccountRef }
        : { value: "81" }; // Default inventory asset account
      itemPayload.ExpenseAccountRef = itemData.expenseAccountRef
        ? { value: itemData.expenseAccountRef }
        : { value: "80" }; // Default COGS account
    }

    return this.makeRequest("POST", "/item", itemPayload);
  }

  async updateItemQuantity(
    itemId: string,
    newQuantity: number,
    syncToken: string,
  ) {
    return this.makeRequest("POST", "/item", {
      Id: itemId,
      QtyOnHand: newQuantity,
      SyncToken: syncToken,
      sparse: true,
    });
  }

  async getItem(itemId: string) {
    return this.makeRequest("GET", `/item/${itemId}`);
  }

  async queryItems(query: string = "SELECT * FROM Item") {
    return this.makeRequest("GET", `/query?query=${encodeURIComponent(query)}`);
  }

  // ========================================
  // INVOICE OPERATIONS
  // ========================================

  async createInvoice(invoiceData: {
    customerId: string;
    lines: Array<{
      itemId: string;
      description?: string;
      quantity: number;
      unitPrice: number;
    }>;
    txnDate?: string;
    dueDate?: string;
    docNumber?: string;
  }) {
    const lineItems = invoiceData.lines.map((line, index) => ({
      DetailType: "SalesItemLineDetail",
      Amount: line.quantity * line.unitPrice,
      SalesItemLineDetail: {
        ItemRef: { value: line.itemId },
        Qty: line.quantity,
        UnitPrice: line.unitPrice,
      },
      Description: line.description,
      LineNum: index + 1,
    }));

    return this.makeRequest("POST", "/invoice", {
      CustomerRef: { value: invoiceData.customerId },
      Line: lineItems,
      TxnDate: invoiceData.txnDate || new Date().toISOString().split("T")[0],
      DueDate: invoiceData.dueDate,
      DocNumber: invoiceData.docNumber,
    });
  }

  async getInvoice(invoiceId: string) {
    return this.makeRequest("GET", `/invoice/${invoiceId}`);
  }

  // ========================================
  // BILL (PURCHASE) OPERATIONS
  // ========================================

  async createBill(billData: {
    vendorId: string;
    lines: Array<{
      itemId?: string;
      accountId?: string;
      description?: string;
      amount: number;
      quantity?: number;
    }>;
    txnDate?: string;
    dueDate?: string;
    docNumber?: string;
  }) {
    const lineItems = billData.lines.map((line, index) => {
      if (line.itemId) {
        return {
          DetailType: "ItemBasedExpenseLineDetail",
          Amount: line.amount,
          ItemBasedExpenseLineDetail: {
            ItemRef: { value: line.itemId },
            Qty: line.quantity || 1,
            UnitPrice: line.amount / (line.quantity || 1),
          },
          Description: line.description,
          LineNum: index + 1,
        };
      } else {
        return {
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: line.amount,
          AccountBasedExpenseLineDetail: {
            AccountRef: { value: line.accountId || "1" },
          },
          Description: line.description,
          LineNum: index + 1,
        };
      }
    });

    return this.makeRequest("POST", "/bill", {
      VendorRef: { value: billData.vendorId },
      Line: lineItems,
      TxnDate: billData.txnDate || new Date().toISOString().split("T")[0],
      DueDate: billData.dueDate,
      DocNumber: billData.docNumber,
    });
  }

  // ========================================
  // PAYMENT OPERATIONS
  // ========================================

  async createPayment(paymentData: {
    customerId: string;
    amount: number;
    txnDate?: string;
    paymentMethodRef?: string;
  }) {
    return this.makeRequest("POST", "/payment", {
      CustomerRef: { value: paymentData.customerId },
      TotalAmt: paymentData.amount,
      TxnDate: paymentData.txnDate || new Date().toISOString().split("T")[0],
      PaymentMethodRef: paymentData.paymentMethodRef
        ? { value: paymentData.paymentMethodRef }
        : undefined,
    });
  }

  // ========================================
  // REPORTS
  // ========================================

  async getReport(reportName: string, params?: Record<string, string>) {
    const queryParams = params
      ? "&" + new URLSearchParams(params).toString()
      : "";
    return this.makeRequest("GET", `/reports/${reportName}?${queryParams}`);
  }

  async getProfitAndLoss(startDate: string, endDate: string) {
    return this.getReport("ProfitAndLoss", {
      start_date: startDate,
      end_date: endDate,
    });
  }

  async getInventoryValuationSummary() {
    return this.getReport("InventoryValuationSummary");
  }
}

// Singleton instance
let quickbooksClient: QuickBooksClient | null = null;

export function getQuickBooksClient(tokens?: {
  accessToken?: string;
  refreshToken?: string;
  realmId?: string;
}): QuickBooksClient {
  if (!quickbooksClient) {
    quickbooksClient = new QuickBooksClient({
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      redirectUri: process.env.QUICKBOOKS_REDIRECT_URI!,
      environment:
        (process.env.QUICKBOOKS_ENVIRONMENT as "sandbox" | "production") ||
        "sandbox",
      accessToken: tokens?.accessToken || process.env.QUICKBOOKS_ACCESS_TOKEN,
      refreshToken:
        tokens?.refreshToken || process.env.QUICKBOOKS_REFRESH_TOKEN,
      realmId: tokens?.realmId || process.env.QUICKBOOKS_REALM_ID,
    });
  }
  return quickbooksClient;
}

export { QuickBooksClient };
