<script lang="ts">
	let { placeholder = 'Select...', label }: { placeholder?: string; label?: string } = $props();
</script>

<span data-slot="select-value" class="truncate">
	{#if label}
		{label}
	{:else}
		<span class="text-muted-foreground">{placeholder}</span>
	{/if}
</span>
