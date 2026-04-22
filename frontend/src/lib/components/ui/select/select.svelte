<script lang="ts">
	import { Select as SelectPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	let {
		open = $bindable(false),
		value = $bindable<string | undefined>(),
		onValueChange,
		children,
		...restProps
	}: {
		open?: boolean;
		value?: string;
		onValueChange?: (v: string) => void;
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

<SelectPrimitive.Root type="single" bind:open bind:value={value as never} {onValueChange} {...restProps}>
	{@render children?.()}
</SelectPrimitive.Root>
