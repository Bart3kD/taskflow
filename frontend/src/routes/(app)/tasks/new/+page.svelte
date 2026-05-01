<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';
	import { untrack } from 'svelte';
	import { ArrowLeft, Check, ChevronsUpDown, RefreshCw, Calendar, User } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// ##############################################
	// Form state
	// ##############################################

	let title           = $state('');
	let description     = $state('');
	let assignedTo      = $state(untrack(() => data.user.id));
	let deadlineType    = $state<'once' | 'recurring'>('once');
	let recurrenceType  = $state('every_n_days');
	let deadlineDate    = $state('');
	let overallDeadlineDate = $state('');
	let rcN             = $state(7);
	let rcDayOfMonth    = $state(1);
	let rcDayOfWeek     = $state('1');
	let rcTime          = $state('09:00');

	// ##############################################
	// UI state
	// ##############################################

	let loading      = $state(false);
	let error        = $state('');
	let assigneeOpen = $state(false);

	const assignedName = $derived(data.members.find((m) => m.id === assignedTo)?.name ?? 'Select person…');
	const minDatetime  = new Date().toISOString().slice(0, 16);

	const weekdays = [
		{ label: 'Monday', value: 1 }, { label: 'Tuesday', value: 2 },
		{ label: 'Wednesday', value: 3 }, { label: 'Thursday', value: 4 },
		{ label: 'Friday', value: 5 }, { label: 'Saturday', value: 6 },
		{ label: 'Sunday', value: 0 },
	];

	function rcHour() { return parseInt(rcTime.split(':')[0]); }

	function buildPayload() {
		const base: Record<string, unknown> = { title, assignedTo, deadlineType };
		if (description) base.description = description;
		if (deadlineType === 'once') {
			if (deadlineDate) base.deadlineDate = new Date(deadlineDate).toISOString();
		} else {
			base.recurrenceType = recurrenceType;
			if      (recurrenceType === 'every_n_days')  base.recurrenceConfig = { n: rcN, hour: rcHour() };
			else if (recurrenceType === 'day_of_month')  base.recurrenceConfig = { dayOfMonth: rcDayOfMonth, hour: rcHour() };
			else if (recurrenceType === 'day_of_week')   base.recurrenceConfig = { dayOfWeek: parseInt(rcDayOfWeek), hour: rcHour() };
			else                                         base.recurrenceConfig = { hour: rcHour() };
			if (overallDeadlineDate) base.deadlineDate = new Date(overallDeadlineDate).toISOString();
		}
		return base;
	}

	async function handleCreate() {
		if (!title.trim()) return;
		loading = true;
		error = '';
		const res = await fetch('/api/tasks', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(buildPayload())
		});
		loading = false;
		if (res.ok) {
			const task = await res.json();
			goto(`/tasks/${task.id}`);
		} else {
			error = await res.text().catch(() => 'Failed to create task');
		}
	}

	function autoResize(e: Event) {
		const el = e.currentTarget as HTMLTextAreaElement;
		el.style.height = 'auto';
		el.style.height = el.scrollHeight + 'px';
	}
</script>

<div class="max-w-[44rem]">

	<!-- Navigation -->
	<div class="mb-10">
		<a
			href="/tasks"
			class="group flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors w-fit"
		>
			<ArrowLeft class="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
			Tasks
		</a>
	</div>

	<!-- Title with accent border -->
	<div class="pl-4 mb-8" style="border-left: 3px solid var(--muted-foreground)">
		<textarea
			bind:value={title}
			oninput={autoResize}
			placeholder="Task title"
			rows={1}
			class="w-full resize-none bg-transparent text-[1.875rem] font-bold leading-snug text-foreground outline-none placeholder:text-muted-foreground/40 overflow-hidden"
			style="height: auto"
		></textarea>
	</div>

	<!-- Description -->
	<div class="mb-8">
		<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
			Description
		</p>
		<textarea
			bind:value={description}
			oninput={autoResize}
			placeholder="Add a description for this task…"
			rows={3}
			class="w-full resize-none bg-transparent text-[0.9375rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-border focus:border-foreground/30 transition-colors duration-200 pb-3"
		></textarea>
	</div>

	<!-- Assignee + Task type -->
	<div class="grid grid-cols-2 gap-6 mb-8">
		<div>
			<div class="flex items-center gap-1.5 mb-2.5">
				<User class="size-3 text-muted-foreground" />
				<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
					Assignee
				</p>
			</div>
			<Popover.Root bind:open={assigneeOpen}>
				<Popover.Trigger>
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-[0.875rem] text-foreground hover:bg-muted/50 transition-colors"
					>
						{assignedName}
						<ChevronsUpDown class="size-3.5 shrink-0 opacity-40" />
					</button>
				</Popover.Trigger>
				<Popover.Content class="w-[280px] p-0">
					<Command.Root>
						<Command.Input placeholder="Search…" />
						<Command.List>
							<Command.Empty>No person found.</Command.Empty>
							<Command.Group>
								{#each data.members as m}
									<Command.Item
										value={m.name}
										onSelect={() => { assignedTo = m.id; assigneeOpen = false; }}
									>
										<Check class="size-4 {assignedTo === m.id ? 'opacity-100' : 'opacity-0'}" />
										{m.name}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>

		<div>
			<div class="flex items-center gap-1.5 mb-2.5">
				<RefreshCw class="size-3 text-muted-foreground" />
				<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
					Task type
				</p>
			</div>
			<div class="flex gap-2">
				{#each [['once', 'One-time'], ['recurring', 'Recurring']] as [val, lbl]}
					<button
						type="button"
						onclick={() => (deadlineType = val as 'once' | 'recurring')}
						class="flex-1 rounded-lg border py-2 text-[0.8125rem] font-medium transition-all duration-150
							{deadlineType === val
							? 'border-foreground bg-foreground text-background'
							: 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground'}"
					>
						{lbl}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<!-- Deadline / Schedule -->
	<div class="mb-8">
		<div class="flex items-center gap-1.5 mb-3">
			<Calendar class="size-3 text-muted-foreground" />
			<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
				{deadlineType === 'once' ? 'Deadline' : 'Schedule'}
			</p>
		</div>

		{#if deadlineType === 'once'}
			<Input type="datetime-local" bind:value={deadlineDate} min={minDatetime} class="max-w-[16rem]" />
		{:else}
			<div class="space-y-4">
				<div>
					<p class="text-[0.75rem] text-muted-foreground mb-1.5">Recurrence type</p>
					<Select.Root bind:value={recurrenceType}>
						<Select.Trigger class="w-full max-w-[16rem]">
							<Select.Value label={{
								every_n_days: 'Every N days', day_of_month: 'Day of month',
								day_of_week: 'Day of week', first_day_of_month: 'First day of month',
								last_day_of_month: 'Last day of month'
							}[recurrenceType]} />
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="every_n_days">Every N days</Select.Item>
							<Select.Item value="day_of_month">Day of month</Select.Item>
							<Select.Item value="day_of_week">Day of week</Select.Item>
							<Select.Item value="first_day_of_month">First day of month</Select.Item>
							<Select.Item value="last_day_of_month">Last day of month</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				{#if recurrenceType === 'every_n_days'}
					<div class="grid grid-cols-2 gap-4 max-w-[20rem]">
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Every N days</p>
							<Input type="number" min="1" bind:value={rcN} />
						</div>
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Time</p>
							<Input type="time" bind:value={rcTime} />
						</div>
					</div>
				{:else if recurrenceType === 'day_of_month'}
					<div class="grid grid-cols-2 gap-4 max-w-[20rem]">
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Day of month</p>
							<Input type="number" min="1" max="31" bind:value={rcDayOfMonth} />
						</div>
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Time</p>
							<Input type="time" bind:value={rcTime} />
						</div>
					</div>
				{:else if recurrenceType === 'day_of_week'}
					<div class="grid grid-cols-2 gap-4 max-w-[20rem]">
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Day of week</p>
							<Select.Root bind:value={rcDayOfWeek}>
								<Select.Trigger class="w-full">
									<Select.Value label={weekdays.find((d) => String(d.value) === rcDayOfWeek)?.label} />
								</Select.Trigger>
								<Select.Content>
									{#each weekdays as day}
										<Select.Item value={String(day.value)}>{day.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
						<div>
							<p class="text-[0.75rem] text-muted-foreground mb-1.5">Time</p>
							<Input type="time" bind:value={rcTime} />
						</div>
					</div>
				{:else}
					<div class="max-w-[9rem]">
						<p class="text-[0.75rem] text-muted-foreground mb-1.5">Time</p>
						<Input type="time" bind:value={rcTime} />
					</div>
				{/if}

				<div>
					<p class="text-[0.75rem] text-muted-foreground mb-1.5">
						Overall deadline
						<span class="text-muted-foreground/60">(optional)</span>
					</p>
					<Input type="datetime-local" bind:value={overallDeadlineDate} class="max-w-[16rem]" />
					<p class="text-[0.6875rem] text-muted-foreground/70 mt-1.5">Task expires on this date.</p>
				</div>
			</div>
		{/if}
	</div>

	{#if error}
		<p class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive mb-4">
			{error}
		</p>
	{/if}

	<div class="flex items-center gap-3">
		<Button onclick={handleCreate} disabled={loading || !title.trim()} class="min-w-[9rem]">
			{loading ? 'Creating…' : 'Create task'}
		</Button>
		{#if !title.trim()}
			<p class="text-[0.8125rem] text-muted-foreground">Enter a title to continue.</p>
		{/if}
	</div>

</div>
