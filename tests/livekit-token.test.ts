import { afterEach, describe, expect, it } from "vitest";
import { createLiveKitParticipantToken } from "../lib/server/livekit-token";

const ORIGINAL_ENV = {
  LIVEKIT_URL: process.env.LIVEKIT_URL,
  LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET
};

afterEach(() => {
  process.env.LIVEKIT_URL = ORIGINAL_ENV.LIVEKIT_URL;
  process.env.LIVEKIT_API_KEY = ORIGINAL_ENV.LIVEKIT_API_KEY;
  process.env.LIVEKIT_API_SECRET = ORIGINAL_ENV.LIVEKIT_API_SECRET;
});

describe("createLiveKitParticipantToken", () => {
  it("creates a token payload with room and participant identity", async () => {
    process.env.LIVEKIT_URL = "wss://vera-example.livekit.cloud";
    process.env.LIVEKIT_API_KEY = "key";
    process.env.LIVEKIT_API_SECRET = "secret";

    const payload = await createLiveKitParticipantToken({
      room_name: "vera-room",
      participant_identity: "vera-user",
      participant_name: "Vera User"
    });

    expect(payload.server_url).toBe("wss://vera-example.livekit.cloud");
    expect(payload.room_name).toBe("vera-room");
    expect(payload.participant_identity).toBe("vera-user");
    expect(payload.participant_token.split(".")).toHaveLength(3);
  });

  it("throws when the livekit environment variables are missing", async () => {
    process.env.LIVEKIT_URL = "";
    process.env.LIVEKIT_API_KEY = "";
    process.env.LIVEKIT_API_SECRET = "";

    await expect(createLiveKitParticipantToken()).rejects.toThrow(/LiveKit is not configured/i);
  });
});
