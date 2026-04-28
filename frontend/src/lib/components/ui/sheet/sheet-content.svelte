<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	import SheetOverlay from "./sheet-overlay.svelte";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import XIcon from "@lucide/svelte/icons/x";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: DialogPrimitive.ContentProps & { children: Snippet } = $props();
</script>

<DialogPrimitive.Portal>
	<SheetOverlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		class={cn(
			"bg-background fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l shadow-xl sm:max-w-[30rem]",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<DialogPrimitive.Close>
			{#snippet child({ props })}
				<Button
					variant="ghost"
					size="icon-sm"
					class="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
					{...props}
				>
					<XIcon class="size-4" />
					<span class="sr-only">Close</span>
				</Button>
			{/snippet}
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
