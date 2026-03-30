import { AccessToken } from "livekit-server-sdk";
import { getLiveKitConfig } from "@/lib/server/livekit";

export type LiveKitTokenRequest = {
  participant_name?: string;
  participant_identity?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_name?: string;
  room_config?: unknown;
  groq_api_key?: string;
};

export async function createLiveKitParticipantToken(
  body: LiveKitTokenRequest = {}
) {
  const config = getLiveKitConfig();
  const { url, apiKey, apiSecret, agentName } = config;

  if (!url || !apiKey || !apiSecret) {
    throw new Error(
      "LiveKit is not configured. Check your server's .env file."
    );
  }

  const roomName = body.room_name || `vera-room-${Date.now()}`;
  const participantIdentity =
    body.participant_identity || `vera-user-${crypto.randomUUID()}`;
  const participantName = body.participant_name || "Vera User";

  // Embed the Groq key and any other ephemeral data in metadata
  const metadataObj = {
    groq_api_key: body.groq_api_key,
    original_metadata: body.participant_metadata || ""
  };
  const metadata = JSON.stringify(metadataObj);

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    metadata,
    attributes: body.participant_attributes || {},
    ttl: "10m"
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true
  });

  token.roomConfig = (body.room_config ??
    ({
      agents: [
        {
          agentName,
          metadata
        }
      ]
    } as const)) as never;

  return {
    server_url: url,
    participant_token: await token.toJwt(),
    room_name: roomName,
    participant_identity: participantIdentity,
    agent_name: agentName
  };
}
