/**
 * Conversion Service
 * Prepares the system for Closed-Loop Marketing by tracking conversion signals (sales/wins)
 * and preparing them for future submission to Google Ads API or Meta CAPI.
 */

const sendConversionSignal = async (lead, value) => {
    // 1. Check if the lead has advertising tracking data
    const adData = lead.adData;
    if (!adData || !adData.source) {
        console.log(`[CONVERSION SIGNAL] Lead ${lead.id} (${lead.name}) has no ad tracking data. Skipping.`);
        return;
    }

    console.log(`[CONVERSION SIGNAL] Preparing signal for ${adData.source}...`);

    /**
     * Future Implementation:
     * 
     * If source === 'google' && adData.gclid:
     *   - Authenticate with Google Ads API
     *   - Send Offline Conversion (Value, Currency, Timestamp, GCLID)
     * 
     * If source === 'facebook' && adData.fbclid:
     *   - Use Meta Conversions API (CAPI)
     *   - Send event 'Purchase' with lead detail and fbclid/fbp
     */

    // For now, record the intent in the system logs for audit and verification
    const trackingId = adData.gclid || adData.fbclid || adData.adId;

    console.log(`
--------------------------------------------------
[OFFLINE CONVERSION DETECTED]
Lead: ${lead.name} (ID: ${lead.id})
Platform: ${adData.source}
Converted Value: R$ ${value}
Tracking ID: ${trackingId}
Date: ${new Date().toISOString()}
--------------------------------------------------
    `);
};

module.exports = { sendConversionSignal };
