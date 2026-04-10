import { DERIV_API, DERIV_CONFIG } from "./deriv-config"

export class DerivRESTClient {
    private appId: string
    private token: string | null = null

    constructor(appId: string = DERIV_CONFIG.APP_ID) {
        this.appId = appId
        this.resolveToken()
    }

    private resolveToken() {
        if (typeof window !== "undefined") {
            this.token = 
                localStorage.getItem("deriv_auth_token") || 
                localStorage.getItem("authToken") || 
                localStorage.getItem("clientToken") || 
                localStorage.getItem("deriv_api_token")
        }
    }

    setToken(token: string) {
        this.token = token
    }

    private async request(path: string, options: RequestInit = {}): Promise<any> {
        const url = `${DERIV_API.REST_BASE}${path}`
        const headers = new Headers(options.headers || {})

        headers.set("Deriv-App-ID", this.appId)
        
        const hasBody = options.body !== undefined
        if (hasBody) {
            headers.set("Content-Type", "application/json")
        }

        if (this.token) {
            headers.set("Authorization", `Bearer ${this.token}`)
        }

        const response = await fetch(url, {
            ...options,
            headers
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `REST Request failed with status ${response.status}`)
        }

        return response.json()
    }

    /**
     * ✅ DERIV API V1: Fetch OTP URL for WebSocket authentication
     * 
     * Endpoint: POST /trading/v1/options/accounts/{id}/otp
     * 
     * The returned URL already contains the OTP token as a query parameter;
     * pass it directly to `new WebSocket(url)` — do NOT append anything to it.
     *
     * @param accountId The options account ID (e.g., DOT12345)
     * @returns Full OTP WebSocket URL (wss://…?otp=…)
     */
    async getOTP(accountId: string): Promise<string> {
        try {
            console.log(`[v0] 🔐 Deriv V1 OTP Request: Account ${accountId}`)
            const data = await this.request(`/trading/v1/options/accounts/${accountId}/otp`, {
                method: "POST"
            })
            
            // Response shape: { data: { url: "wss://…?otp=…" } }
            const url = data?.data?.url as string | undefined
            if (!url) {
                throw new Error(`OTP response missing data.url (got: ${JSON.stringify(data)})`)
            }
            
            // Validate URL format
            if (!url.startsWith("wss://") && !url.startsWith("ws://")) {
                throw new Error(`Invalid OTP URL format: ${url}`)
            }
            
            console.log(`[v0] ✅ V1 OTP URL Generated: ${url.split("?")[0]}?otp=***`)
            return url
        } catch (error) {
            console.error("[v0] ❌ Deriv V1 OTP Request Failed:", error)
            throw error
        }
    }

    /**
     * ✅ DERIV API V1: Get all Options accounts for the authenticated user
     * 
     * Endpoint: GET /trading/v1/options/accounts
     * Returns the raw `data` array from the REST response.
     */
    async getAccounts(): Promise<any[]> {
        try {
            console.log(`[v0] 📊 Deriv V1 getAccounts: Fetching options accounts`)
            const res = await this.request("/trading/v1/options/accounts", {
                method: "GET"
            })
            
            const accounts = res?.data ?? res ?? []
            console.log(`[v0] ✅ V1 Accounts: Found ${accounts.length} account(s)`)
            if (accounts.length > 0) {
                accounts.forEach((acc: any, idx: number) => {
                    console.log(`[v0]   [${idx + 1}] ${acc.account_id} (${acc.account_type})`)
                })
            }
            
            return accounts
        } catch (error) {
            console.error("[v0] ❌ Deriv V1 getAccounts Failed:", error)
            throw error
        }
    }

    /**
     * ✅ DERIV API V1: Select the best account (prefers demo)
     * Returns its account_id and account_type.
     * Mirrors the reference DerivClient.selectAccount() behaviour.
     */
    async selectAccount(): Promise<{ account_id: string; account_type: 'demo' | 'real' }> {
        try {
            const accounts = await this.getAccounts() as Array<{ account_id: string; account_type: 'demo' | 'real' }>
            if (!accounts || accounts.length === 0) {
                throw new Error('No Options accounts found')
            }
            
            // Prefer demo accounts for testing
            const selected = accounts.find(a => a.account_type === 'demo') || accounts[0]
            console.log(`[v0] ✅ V1 selectAccount: Selected ${selected.account_id} (${selected.account_type})`)
            return selected
        } catch (error) {
            console.error("[v0] ❌ V1 selectAccount Failed:", error)
            throw error
        }
    }

    /**
     * ✅ DERIV API V1: Reset demo account balance
     * 
     * Endpoint: POST /trading/v1/options/accounts/{id}/reset-demo-balance
     * Only works for demo accounts.
     */
    async resetDemoBalance(accountId: string): Promise<any> {
        try {
            console.log(`[v0] 🔄 Deriv V1 resetDemoBalance: Account ${accountId}`)
            const result = await this.request(`/trading/v1/options/accounts/${accountId}/reset-demo-balance`, {
                method: "POST"
            })
            console.log(`[v0] ✅ V1 Demo Balance Reset: ${accountId}`)
            return result
        } catch (error) {
            console.error("[v0] ❌ V1 resetDemoBalance Failed:", error)
            throw error
        }
    }
}

export const derivREST = new DerivRESTClient()
