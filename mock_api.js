/**
 * clampDatabaseService.js
 * 
 * Simulated asynchronous database service that fetches from mock_db.json.
 * Exposes methods to lookup users via Policy, Aadhaar, and Mobile.
 */

class ClampDatabaseService {
    constructor(dbUrl = 'mock_db.json') {
        this.dbUrl = dbUrl;
        this.cache = null;
    }

    /**
     * Initializes the DB by fetching the JSON file.
     */
    async init() {
        if (this.cache) return this.cache;
        try {
            const response = await fetch(this.dbUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.cache = data.users;
            console.log("Mock Database initialized:", this.cache.length, "records loaded.");
            return this.cache;
        } catch (error) {
            console.error("Failed to load mock database:", error);
            return [];
        }
    }

    /**
     * Look up a user by specific field in the search_index.
     * @param {string} key - "policy_number", "aadhaar_number", or "mobile_number"
     * @param {string} value 
     */
    async _search(key, value) {
        await this.init(); // Ensure data is loaded
        const record = this.cache.find(user => user.search_index[key] === value);
        
        if (record) {
            // Simulate network latency
            await new Promise(resolve => setTimeout(resolve, 800));
            return {
                status: "success",
                data: record
            };
        } else {
            return {
                status: "not_found",
                message: `No record found for ${key.replace('_', ' ')}: ${value}`
            };
        }
    }

    // Specific lookup methods
    async getUserByPolicy(policyNumber) {
        return this._search('policy_number', policyNumber);
    }

    async getUserByAadhaar(aadhaarNumber) {
        return this._search('aadhaar_number', aadhaarNumber);
    }

    async getUserByMobile(mobileNumber) {
        return this._search('mobile_number', mobileNumber);
    }
}

// ----------------------------------------------------------------------
// BONUS: Logic to utilize the service and auto-fill a UI 
// ----------------------------------------------------------------------

const dbService = new ClampDatabaseService();

/**
 * Example function to lookup user and auto-fill the UI context
 */
async function triggerClaimAutoFill(lookupType, lookupValue) {
    console.log(`Starting auto-fill sequence for ${lookupType}: ${lookupValue}...`);
    
    // Abstract the fetch logic
    let response;
    if (lookupType === 'policy') response = await dbService.getUserByPolicy(lookupValue);
    else if (lookupType === 'aadhaar') response = await dbService.getUserByAadhaar(lookupValue);
    else if (lookupType === 'mobile') response = await dbService.getUserByMobile(lookupValue);
    
    if (response.status === 'success') {
        const u = response.data;
        console.log("User Data Found! Simulating auto-fill...");
        
        // Example of how you would pre-fill a UI state or UI elements:
        const claimContext = {
            verification: "PASSED",
            identity: {
                name: u.user_details.full_name,
                contact: u.user_details.mobile_number,
                masked_aadhaar: u.user_details.aadhaar.masked
            },
            policy: {
                number: u.policy_details.policy_number,
                insurer: u.policy_details.insurer_name,
                validity: `${u.policy_details.policy_start_date} to ${u.policy_details.policy_end_date}`,
                type: u.policy_details.policy_type
            },
            vehicle: {
                make_model: `${u.vehicle_details.manufacturer} ${u.vehicle_details.model} ${u.vehicle_details.variant}`,
                registration: u.vehicle_details.registration_number,
                color: u.vehicle_details.color
            },
            risk_profile: {
                past_claims_count: u.claim_history.total_claims
            }
        };

        // If you were to plug this directly into the dashboard.html, you could do:
        // document.getElementById('userNameDisplay').innerText = claimContext.identity.name;
        // document.getElementById('vehicleDisplay').innerText = claimContext.vehicle.make_model;
        
        console.log("Auto-filled Context Context Ready:", claimContext);
        return claimContext;
    } else {
        console.warn("Auto-fill failed:", response.message);
        return null;
    }
}

// Export for usage or make available globally purely for vanilla browser use
if (typeof window !== 'undefined') window.ClampDatabaseService = ClampDatabaseService;
if (typeof window !== 'undefined') window.triggerClaimAutoFill = triggerClaimAutoFill;
