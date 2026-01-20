export const CALL_OUTCOME_TOOLTIPS: Record<string, { label: string; tooltip: string }> = {
  completed: {
    label: "Completed",
    tooltip: "The call was successfully completed. The AI agent finished the conversation flow, collected available information, and logged the call."
  },
  declined: {
    label: "Declined",
    tooltip: "The recipient declined to proceed with the conversation or explicitly stated they were not interested."
  },
  callback_requested: {
    label: "Callback Requested",
    tooltip: "The recipient requested a follow-up call at a later time. A callback should be scheduled or queued."
  },
  confirmed: {
    label: "Confirmed",
    tooltip: "The recipient confirmed interest and agreed to proceed (e.g., load details, availability, or next steps were confirmed)."
  },
  unconfirmed: {
    label: "Unconfirmed",
    tooltip: "The call ended without a clear confirmation or decline. Additional follow-up may be required."
  },
  voicemail: {
    label: "Voicemail",
    tooltip: "The call reached voicemail. A message may have been left depending on configuration."
  },
  error: {
    label: "Error",
    tooltip: "The call ended due to a technical issue or system error. Review logs for details."
  },
  interested: {
    label: "Interested",
    tooltip: "The recipient expressed interest in the load or opportunity."
  },
  booked: {
    label: "Booked",
    tooltip: "The load was successfully booked with this carrier."
  },
  countered: {
    label: "Countered",
    tooltip: "The recipient made a counter-offer on rate or terms."
  },
  failed: {
    label: "Failed",
    tooltip: "The call failed to connect or was terminated unexpectedly."
  },
  lead_created: {
    label: "Lead Created",
    tooltip: "A qualified lead was captured from this call."
  },
  caller_hung_up: {
    label: "Caller Hung Up",
    tooltip: "The caller ended the call before completion."
  },
  no_load_found: {
    label: "No Load Found",
    tooltip: "No matching load was available for the caller's request."
  },
  call_completed: {
    label: "Call Completed",
    tooltip: "The call finished normally without a specific outcome classification."
  },
  unknown: {
    label: "Unknown",
    tooltip: "The outcome of this call could not be determined."
  },
  pending: {
    label: "Pending",
    tooltip: "The call outcome is still being processed."
  }
};

export const getOutcomeLabel = (outcome: string | null): string => {
  if (!outcome) return "Pending";
  return CALL_OUTCOME_TOOLTIPS[outcome]?.label || outcome.replace(/_/g, " ");
};

export const getOutcomeTooltip = (outcome: string | null): string => {
  if (!outcome) return CALL_OUTCOME_TOOLTIPS.pending.tooltip;
  return CALL_OUTCOME_TOOLTIPS[outcome]?.tooltip || `Call outcome: ${outcome}`;
};
