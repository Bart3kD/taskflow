<script lang="ts" generics="T extends string">
	type Option = { value: T; label: string };

	type Props = {
		options: Option[];
		value: T;
	};

	let { options, value = $bindable() }: Props = $props();
</script>

<div class="inline-flex h-9 rounded-lg border border-border p-0.5 bg-muted/30 gap-0.5">
	{#each options as opt}
		<button
			type="button"
			class="h-full px-3 pt-px rounded-md text-[0.8125rem] font-medium transition-all leading-none inline-flex items-center justify-center
				{value === opt.value
				? 'bg-primary text-primary-foreground'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => (value = opt.value)}
		>{opt.label}</button>
	{/each}
</div>
