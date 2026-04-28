<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';
	import { untrack } from 'svelte';
	import {
		ArrowLeft, Copy, Trash2, Check, ChevronsUpDown, Link2,
		RefreshCw, Calendar, User
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// ##############################################
	// Form state (inlined — full control over layout)
	// ##############################################

	let title       = $state(untrack(() => data.task.title));
	let description = $state(untrack(() => data.task.description ?? ''));
	let assignedTo  = $state(untrack(() => data.task.assignedTo));
	let status      = $state(untrack(() => data.task.status));
	let deadlineType      = $state<'once' | 'recurring'>(untrack(() => data.task.deadlineType));
	let recurrenceType    = $state(untrack(() => data.task.recurrenceType ?? 'every_n_days'));
	let deadlineDate      = $state(untrack(() =>
		data.task.deadlineDate ? new Date(data.task.deadlineDate as Date).toISOString().slice(0, 16) : ''
	));
	let overallDeadlineDate = $state(untrack(() =>
		data.task.deadlineType === 'recurring' && data.task.deadlineDate
			? new Date(data.task.deadlineDate as Date).toISOString().slice(0, 16)
			: ''
	));
	let rcN         = $state(untrack(() => data.task.recurrenceConfig?.n ?? 7));
	let rcDayOfMonth = $state(untrack(() => data.task.recurrenceConfig?.dayOfMonth ?? 1));
	let rcDayOfWeek  = $state(String(untrack(() => data.task.recurrenceConfig?.dayOfWeek ?? 1)));
	const initialHour = untrack(() => data.task.recurrenceConfig?.hour ?? 9);
	let rcTime = $state(initialHour.toString().padStart(2, '0') + ':00');

	// ##############################################
	// UI state
	// ##############################################

	let loading    = $state(false);
	let error      = $state('');
	let savedOk    = $state(false);
	let deleting   = $state(false);
	let tokenUrl   = $state('');
	let copied     = $state(false);
	let assigneeOpen = $state(false);

	const members = $derived(
		data.members.length ? data.members : [{ id: data.task.assignedTo, name: '—' }]
	);
	const assignedName = $derived(members.find((m) => m.id === assignedTo)?.name ?? 'Select person…');
	const minDatetime = new Date().toISOString().slice(0, 16);

	const weekdays = [
		{ label: 'Monday', value: 1 }, { label: 'Tuesday', value: 2 },
		{ label: 'Wednesday', value: 3 }, { label: 'Thursday', value: 4 },
		{ label: 'Friday', value: 5 }, { label: 'Saturday', value: 6 },
		{ label: 'Sunday', value: 0 },
	];

	const statusConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
		pending:     { label: 'Pending',     color: 'var(--muted-foreground)',   bg: 'oklch(0.552 0.016 285.938 / 0.1)',  ring: 'oklch(0.552 0.016 285.938 / 0.3)'  },
		in_progress: { label: 'In Progress', color: 'var(--color-status-blue)',  bg: 'oklch(0.488 0.243 264.376 / 0.1)',  ring: 'oklch(0.488 0.243 264.376 / 0.35)' },
		done:        { label: 'Done',        color: 'var(--color-status-green)', bg: 'oklch(0.627 0.194 142.495 / 0.1)',  ring: 'oklch(0.627 0.194 142.495 / 0.35)' },
		overdue:     { label: 'Overdue',     color: 'var(--color-status-red)',   bg: 'oklch(0.577 0.245 27.325 / 0.1)',   ring: 'oklch(0.577 0.245 27.325 / 0.35)'  },
		problem:     { label: 'Problem',     color: 'var(--color-status-yellow)',bg: 'oklch(0.795 0.184 86.047 / 0.1)',   ring: 'oklch(0.795 0.184 86.047 / 0.35)'  },
	};

	const currentStatus = $derived(statusConfig[status] ?? statusConfig.pending);

	function rcHour() { return parseInt(rcTime.split(':')[0]); }

	function buildPayload() {
		const base: Record<string, unknown> = { title, assignedTo, deadlineType, status };
		base.description = description || null;
		if (deadlineType === 'once') {
			base.deadlineDate = deadlineDate ? new Date(deadlineDate).toISOString() : null;
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

	async function handleSave() {
		loading = true; error = ''; savedOk = false;
		const res = await fetch(`/api/tasks/${data.task.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(buildPayload())
		});
		loading = false;
		if (res.ok) {
			savedOk = true;
			setTimeout(() => (savedOk = false), 3000);
			await invalidateAll();
		} else {
			error = await res.text().catch(() => 'Failed to update task');
		}
	}

	async function generateToken() {
		const res = await fetch(`/api/tasks/${data.task.id}`, { method: 'POST' });
		if (res.ok) {
			const token = await res.json();
			tokenUrl = `${window.location.origin}/confirm/${token.token}`;
		}
	}

	async function deleteTask() {
		if (!confirm('Delete this task?')) return;
		deleting = true;
		await fetch(`/api/tasks/${data.task.id}`, { method: 'DELETE' });
		goto('/tasks');
	}

	function copyToken() {
		navigator.clipboard.writeText(tokenUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function formatDate(d: Date | null | string) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
	}

	function autoResize(e: Event) {
		const el = e.currentTarget as HTMLTextAreaElement;
		el.style.height = 'auto';
		el.style.height = el.scrollHeight + 'px';
	}
</script>

<div class="max-w-[44rem]">

	<!-- ##############################
	     Navigation bar
	     ############################## -->
	<div class="flex items-center justify-between mb-10">
		<a
			href="/tasks"
			class="group flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors"
		>
			<ArrowLeft class="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
			Tasks
		</a>

	</div>

	<!-- ##############################
	     Status pill strip
	     ############################## -->
	<div class="flex items-center gap-1.5 flex-wrap mb-5">
		{#each Object.entries(statusConfig) as [key, cfg]}
			<button
				type="button"
				onclick={() => (status = key as typeof status)}
				class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.75rem] font-medium transition-all duration-150"
				style={status === key
					? `background: ${cfg.bg}; color: ${cfg.color}; box-shadow: 0 0 0 1px ${cfg.ring}`
					: 'color: var(--muted-foreground)'}
			>
				<span
					class="size-1.5 rounded-full shrink-0 transition-colors duration-150"
					style="background: {cfg.color}"
				></span>
				{cfg.label}
			</button>
		{/each}
	</div>

	<!-- ##############################
	     Title + accent border
	     ############################## -->
	<div
		class="pl-4 mb-8 transition-[border-color] duration-500"
		style="border-left: 3px solid {currentStatus.color}"
	>
		<textarea
			bind:value={title}
			oninput={autoResize}
			placeholder="Task title"
			rows={1}
			class="w-full resize-none bg-transparent text-[1.875rem] font-bold leading-snug text-foreground outline-none placeholder:text-muted-foreground/40 overflow-hidden"
			style="height: auto"
		></textarea>
		<p class="text-[0.75rem] text-muted-foreground mt-1.5">
			Created {formatDate(data.task.createdAt)}
			{#if data.task.updatedAt && data.task.updatedAt !== data.task.createdAt}
				· Updated {formatDate(data.task.updatedAt)}
			{/if}
		</p>
	</div>

	<!-- ##############################
	     Description
	     ############################## -->
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



	<!-- ##############################
	     Assignee + Task type
	     ############################## -->
	<div class="grid grid-cols-2 gap-6 mb-8">
		<!-- Assignee -->
		<div>
			<div class="flex items-center gap-1.5 mb-2.5">
				<User class="size-3 text-muted-foreground" />
				<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
					Assignee
				</p>
			</div>
			{#if data.user.role === 'admin'}
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
									{#each members as m}
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
			{:else}
				<p class="text-[0.875rem] text-foreground py-2">{assignedName}</p>
			{/if}
		</div>

		<!-- Task type -->
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

	<!-- ##############################
	     Deadline / Recurrence config
	     ############################## -->
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
					<p class="text-[0.6875rem] text-muted-foreground/70 mt-1.5">
						Task expires on this date.
					</p>
				</div>
			</div>
		{/if}
	</div>



	<!-- ##############################
	     Save action bar
	     ############################## -->
	<div class="flex items-center gap-4">
		<Button onclick={handleSave} disabled={loading} class="min-w-[9rem]">
			{loading ? 'Saving…' : 'Save changes'}
		</Button>

		{#if savedOk}
			<span
				class="flex items-center gap-1.5 text-[0.875rem] font-medium"
				style="color: var(--color-status-green)"
			>
				<Check class="size-4" />
				Saved
			</span>
		{/if}

		{#if error}
			<span class="text-[0.875rem] text-destructive">{error}</span>
		{/if}
	</div>

	<!-- ##############################
	     Admin sections
	     ############################## -->
	{#if data.user.role === 'admin'}
		<div class="mt-14 pt-8 border-t border-border space-y-8">

			<!-- Confirmation token -->
			<div>
				<div class="flex items-center gap-2 mb-1">
					<Link2 class="size-3.5 text-muted-foreground" />
					<h2 class="text-[0.875rem] font-semibold">Confirmation token</h2>
				</div>
				<p class="text-[0.8125rem] text-muted-foreground mb-4 ml-5.5">
					Generate a one-time link so the employee can confirm their task status without logging in.
				</p>

				<Button variant="outline" onclick={generateToken} class="gap-1.5 ml-5.5">
					<Link2 class="size-3.5" />
					Generate link
				</Button>

				{#if tokenUrl}
					<div
						class="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 mt-3 ml-5.5"
					>
						<span class="flex-1 truncate font-mono text-[0.75rem] text-muted-foreground">
							{tokenUrl}
						</span>
						<button
							onclick={copyToken}
							class="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
							title="Copy to clipboard"
						>
							{#if copied}
								<Check class="size-3.5 text-[var(--color-status-green)]" />
							{:else}
								<Copy class="size-3.5" />
							{/if}
						</button>
					</div>
				{/if}
			</div>

			<!-- Danger zone -->
			<div class="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
				<h2 class="text-[0.875rem] font-semibold text-destructive mb-1">Danger zone</h2>
				<p class="text-[0.8125rem] text-muted-foreground mb-4">
					Permanently delete this task and all associated tokens. This action cannot be undone.
				</p>
				<Button
					variant="destructive"
					onclick={deleteTask}
					disabled={deleting}
					class="gap-1.5"
				>
					<Trash2 class="size-3.5 -translate-y-px" />
					{deleting ? 'Deleting…' : 'Delete task'}
				</Button>
			</div>
		</div>
	{/if}

</div>
