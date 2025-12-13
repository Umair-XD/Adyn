import { generateObject } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { config } from "dotenv";

config({ path: ".env.local" });

const schema = z.object({
  summary: z.string(),
  keywords: z.array(z.string()),
  brand_tone: z.string()
});

async function testGatewayUsage() {
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

    console.log("\n🔄 Testing generateObject with usage tracking...");
    
    const result = await generateObject({
      model: gateway("gpt-4o"),
      schema,
      prompt: "Analyze this product: Blue light blocking glasses for computer users. Provide summary, keywords, and brand tone.",
      system: "You are a marketing analysis expert."
    });

    console.log("\n📝 Object Result:");
    console.log("─".repeat(50));
    console.log(JSON.stringify(result.object, null, 2));

    console.log("\n📊 Usage Object:");
    console.log("─".repeat(50));
    console.log("Raw usage:", result.usage);
    console.log("Usage type:", typeof result.usage);
    console.log("Usage keys:", result.usage ? Object.keys(result.usage) : "No usage");
    
    if (result.usage) {
      console.log("\nDetailed Usage Properties:");
      for (const [key, value] of Object.entries(result.usage)) {
        console.log(`  ${key}: ${value} (${typeof value})`);
      }
    }

    // Test different property access methods
    console.log("\n🔍 Testing Property Access:");
    console.log("─".repeat(50));
    
    const usage = result.usage as any;
    console.log("usage:", usage);
    console.log("usage.cost:", usage?.cost);
    console.log("usage.promptTokens:", usage?.promptTokens);
    console.log("usage.completionTokens:", usage?.completionTokens);
    console.log("usage.totalTokens:", usage?.totalTokens);
    console.log("usage.inputTokens:", usage?.inputTokens);
    console.log("usage.outputTokens:", usage?.outputTokens);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testGatewayUsage();