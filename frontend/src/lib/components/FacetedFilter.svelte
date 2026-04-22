<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CirclePlus from '@lucide/svelte/icons/circle-plus';
	import Check from '@lucide/svelte/icons/check';
	import type { Component } from 'svelte';

	type Option = {
		value: string;
		label: string;
		icon?: Component<{ class?: string }>;
		count?: number;
	};

	type Props = {
		label: string;
		options: Option[];
		selected: string[];
		onchange?: (selected: string[]) => void;
	};

	let { label, options, selected = $bindable([]), onchange }: Props = $props();

	let open = $state(false);

	function toggle(value: string) {
		const next = selected.includes(value)
			? selected.filter((v) => v !== value)
			: [...selected, value];
		selected = next;
		onchange?.(next);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		<Button variant="outline" size="sm" class="border-dashed h-9 px-3 text-[0.875rem] leading-none">
			<CirclePlus class="size-3.5" />
			{label}
			{#if selected.length > 0}
				<span class="mx-0.5 h-4 w-px bg-border"></span>
				{#if selected.length <= 2}
					{#each selected as v}
						<Badge variant="secondary" class="rounded-sm px-1.5 py-0 text-[0.75rem] font-normal">
							{options.find((o) => o.value === v)?.label ?? v}
						</Badge>
					{/each}
				{:else}
					<Badge variant="secondary" class="rounded-sm px-1.5 py-0 text-[0.75rem] font-normal">
						{selected.length} selected
					</Badge>
				{/if}
			{/if}
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-[200px] p-0" align="start">
		<Command.Root>
			<Command.Input placeholder={label} />
			<Command.List>
				<Command.Empty>No results.</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item
							value={option.label}
							onSelect={() => toggle(option.value)}
						>
							<div
								class="me-2 flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary
									{selected.includes(option.value) ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'}"
							>
								<Check class="size-3" />
							</div>
							{#if option.icon}
								<option.icon class="size-4 text-muted-foreground" />
							{/if}
							<span>{option.label}</span>
							{#if option.count !== undefined}
								<span class="ms-auto font-mono text-[0.75rem] text-muted-foreground">
									{option.count}
								</span>
							{/if}
						</Command.Item>
					{/each}
				</Command.Group>
				{#if selected.length > 0}
					<Command.Separator />
					<Command.Group>
						<Command.Item
							value="__clear__"
							class="justify-center text-center"
							onSelect={() => { selected = []; onchange?.([]); }}
						>
							Clear filters
						</Command.Item>
					</Command.Group>
				{/if}
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
