<script lang="ts">
  import type { File } from "@luisafk/minifs";
  import type { FileTypeResult } from "@sgtpooki/file-type";
  import type { BundledFile } from "$lib";

  import { onDestroy } from "svelte";

  import { fileTypeFromBuffer } from "@sgtpooki/file-type";

  import CodeView from "./CodeView.svelte";

  export let file: File<BundledFile>;
  let fileType: FileTypeResult | null = null;
  $: processFile(file);

  async function processFile(file: File<BundledFile>) {
    if (!file.content) {
      return;
    }

    fileType = await fileTypeFromBuffer(file.content.contents);

    if (file.isFile() && file.content && fileType?.mime.startsWith("image/")) {
      imageSrc = URL.createObjectURL(new Blob([file.content.contents], { type: fileType.mime }));
    } else {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
      imageSrc = null;
    }
  }

  let imageSrc: string | null = null;

  const decoder = new TextDecoder();
  $: contents = file.content ? decoder.decode(file.content.contents) : null;
  $: sourcemapJson = file.content?.sourcemap ? JSON.stringify(file.content.sourcemap) : null;

  onDestroy(() => {
    if (imageSrc) {
      URL.revokeObjectURL(imageSrc);
    }
  });
</script>

<div>
  <h3 id="file/{file.content?.path}">{file.content?.path}</h3>

  {#if sourcemapJson}
    <h4>Sourcemap</h4>
    <CodeView code={sourcemapJson} language="json" format />
  {/if}

  {#if fileType}
    <p>File MIME: {fileType.mime}</p>
  {/if}

  {#if imageSrc}
    <img src={imageSrc} alt="Bundled file preview for {file.content?.path}" />
  {:else if contents}
    <CodeView code={contents} />
  {/if}
</div>
