export function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const agentName = process.env.LIVEKIT_AGENT_NAME || "vera-agent";

  return {
    url,
    apiKey,
    apiSecret,
    agentName
  };
}

export function hasLiveKitConfig() {
  const { url, apiKey, apiSecret } = getLiveKitConfig();
  return Boolean(url && apiKey && apiSecret);
}
