

import { initLlama } from 'llama.rn';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

/**
 * AIService has been rewritten to use an on‑device language model via
 * llama.rn rather than making network requests to a remote API.  It
 * initialises a Llama context lazily when the first chat request
 * arrives.  The GGUF model is bundled under assets/models and is
 * copied into a writable location at runtime before being loaded.
 */
class AIService {
  private context: any | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Ensures the Llama context has been initialised.  If not yet
   * initialised, this method will download the bundled model asset,
   * copy it into a document directory and call initLlama().  Subsequent
   * calls reuse the existing context.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.context) {
      return;
    }
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    this.initPromise = this.initializeContext();
    await this.initPromise;
  }

  /**
   * Public initialisation method.  Components can call this when
   * mounting to warm up the Llama context in the background.  It
   * returns a promise that resolves once the model is ready.  Calling
   * init() multiple times is safe: subsequent calls will await the
   * existing initialisation.
   */
  init(): Promise<void> {
    return this.ensureInitialized();
  }

  /**
   * Handles the actual initialisation of the Llama context.  It
   * resolves the model asset URI using Expo's Asset system, downloads
   * the asset if necessary, copies it to a writable path and then
   * calls initLlama() with a suitable configuration.  Adjust n_ctx
   * according to your performance requirements.
   */
  private async initializeContext(): Promise<void> {
    // Resolve and download the bundled model asset
    const modelAsset = Asset.fromModule(
      require('../assets/models/SmolLM2-135M-Instruct-Q4_K_M.gguf')
    );
    await modelAsset.downloadAsync();
    const assetPath = modelAsset.localUri || modelAsset.uri;
    // Determine destination path in the app's document directory
    const destPath = FileSystem.documentDirectory + 'SmolLM2-135M-Instruct-Q4_K_M.gguf';
    try {
      const info = await FileSystem.getInfoAsync(destPath);
      if (!info.exists) {
        await FileSystem.copyAsync({ from: assetPath, to: destPath });
      }
    } catch (copyErr) {
      console.warn('Failed to copy GGUF model to document directory:', copyErr);
    }
    // Now initialise the Llama context
    this.context = await initLlama({
      model: destPath,
      // Limit context window to 2048 tokens to reduce memory usage.  Larger
      // values increase accuracy but consume more RAM.
      n_ctx: 2048,
      // On iOS you can specify n_gpu_layers for GPU offload.  It is
      // ignored on Android.
      n_gpu_layers: 0,
      use_mlock: false,
    });
  }

  /**
   * Returns a response from the AI model given the user's message.  The
   * local model is instructed with a system prompt identical to the
   * previous remote agent.  The Llama context is initialised on first
   * call.  Stop words ensure the model stops generating when it hits
   * known end‑of‑turn tokens.
   */
  async getAIResponse(message: string): Promise<string> {
    await this.ensureInitialized();
    const today = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an AI assistant for a calendar application. Your goal is to help users manage their schedule. You MUST respond ONLY with a command in the format ACTION:<COMMAND_NAME>(...). The current date is ${today}.

Supported Actions:
- ACTION:CREATE_EVENT(title="<event_title>", startTime="<YYYY-MM-DDTHH:mm:ss>", endTime="<YYYY-MM-DDTHH:mm:ss>", description="<optional_description>")
- ACTION:READ_EVENTS(title="<event_title_query>")
- ACTION:UPDATE_EVENT(title="<event_title_to_find>", updates="<json_string_of_updates>")
- ACTION:DELETE_EVENT(title="<event_title_to_find>")

Key instructions for UPDATE_EVENT:
- The 'title' parameter is for finding the event. Be flexible; the user might not say the exact title.
- The 'updates' parameter MUST be a valid JSON string. The keys in the JSON can be 'title', 'startTime', 'endTime', or 'description'.
- 'startTime' and 'endTime' values in the JSON MUST be in "YYYY-MM-DDTHH:mm:ss" format.

Examples for UPDATE_EVENT:
- User: "change the team meeting to 5pm"
  AI: ACTION:UPDATE_EVENT(title="team meeting", updates="{\"startTime\":\"${today}T17:00:00\"}")
- User: "update the project deadline's description to 'Final submission'"
  AI: ACTION:UPDATE_EVENT(title="project deadline", updates="{\"description\":\"Final submission\"}")
- User: "rename 'lunch' to 'Lunch with Bob'"
  AI: ACTION:UPDATE_EVENT(title="lunch", updates="{\"title\":\"Lunch with Bob\"}")
- User: "move the doctor appointment on July 28th from 2pm to 3:30pm"
  AI: ACTION:UPDATE_EVENT(title="doctor appointment", updates="{\"startTime\":\"2025-07-28T15:30:00\",\"endTime\":\"2025-07-28T16:30:00\"}")

General Rules:
- Do not include any other text, greetings, or explanations in your response. Just the ACTION.
- If the user does not specify an end time for a new event, assume it is one hour after the start time.
- If the user's request is not about managing events, provide a helpful, conversational response without using an ACTION.`;

    // A list of stop tokens to prevent the model from generating beyond
    // the end of the assistant's turn.  These tokens are taken from
    // common chat templates and may vary between models.
    const stopWords = ['</s>', '<|end|>', '<|im_end|>', '<|endoftext|>'];
    try {
      const result = await this.context.completion(
        {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          n_predict: 256,
          temperature: 0.2,
          stop: stopWords,
        },
        () => {
          /* We ignore partial tokens in this implementation. */
        },
      );
      const responseText = result && result.text ? result.text.toString().trim() : '';
      return responseText.length > 0 ? responseText : 'Sorry, I did not understand.';
    } catch (err) {
      console.error('Local LLM failed to generate completion:', err);
      return 'Error: Could not generate a response from the on‑device model.';
    }
  }
}

export default new AIService();
