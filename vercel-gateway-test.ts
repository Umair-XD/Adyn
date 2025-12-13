import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { config } from "dotenv";

config({ path: ".env.local" });

async function testVercelGateway() {
  const apiKey = process.env.AI_GATEWAY_API_KEY;

  if (!apiKey) {
    console.error("❌ AI_GATEWAY_API_KEY not found");
    return;
  }

  console.log(`✓ Using Vercel Gateway key: ${apiKey.substring(0, 10)}...`);

  try {
    const gateway = createGateway({
      apiKey,
    });

    const result = streamText({
      model: gateway("gpt-4o-mini"), // correct model
      prompt: "Hello from Vercel AI Gateway credits!",
    });

    console.log("\n📝 Response:");
    console.log("─".repeat(50));

    for await (const part of result.textStream) {
      process.stdout.write(part);
    }

    console.log("\n" + "─".repeat(50));

    const usage = await result.usage;
    console.log("\n📊 Usage:", usage);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testVercelGateway();
