<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import * as Select from '$lib/components/ui/select';
	import {
		ExternalLink, Trash2, Loader2, Check, ChevronsUpDown,
		RefreshCw, Calendar, User, X
	} from 'lucide-svelte';
	import type { Task } from '$lib/db/schema';

	type Props = {
		taskId: string | null;
		members: { id: string; name: string }[];
		currentUserId: string;
		userRole: 'admin' | 'member';
		onclose: () => void;
		onupdated: () => void;
		ondeleted: () => void;
	};

	let { taskId, members, currentUserId, userRole, onclose, onupdated, ondeleted }: Props = $props();

	// ##############################################
	// Task loading state
	// ##############################################

	type TaskState =
		| { type: 'idle' }
		| { type: 'loading' }
		| { type: 'success'; task: Task }
		| { type: 'error'; message: string };

	let taskState = $state<TaskState>({ type: 'idle' });

	$effect(() => {
		if (!taskId) { taskState = { type: 'idle' }; return; }
		taskState = { type: 'loading' };
		saveError = ''; savedOk = false; deleting = false;
		fetch(`/api/tasks/${taskId}`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((task: Task) => { taskState = { type: 'success', task }; })
			.catch(() => { taskState = { type: 'error', message: 'Failed to load task.' }; });
	});

	// ##############################################
	// Form state — reset when task changes
	// ##############################################

	let title            = $state('');
	let description      = $state('');
	let assignedTo       = $state('');
	let status           = $state<Task['status']>('pending');
	let deadlineType     = $state<'once' | 'recurring'>('once');
	let recurrenceType   = $state('every_n_days');
	let deadlineDate     = $state('');
	let overallDeadlineDate = $state('');
	let rcN              = $state(7);
	let rcDayOfMonth     = $state(1);
	let rcDayOfWeek      = $state('1');
	let rcTime           = $state('09:00');

	$effect(() => {
		if (taskState.type !== 'success') return;
		const t = taskState.task;
		title           = t.title;
		description     = t.description ?? '';
		assignedTo      = t.assignedTo;
		status          = t.status;
		deadlineType    = t.deadlineType;
		recurrenceType  = t.recurrenceType ?? 'every_n_days';
		deadlineDate    = t.deadlineDate ? new Date(t.deadlineDate as Date).toISOString().slice(0, 16) : '';
		overallDeadlineDate = t.deadlineType === 'recurring' && t.deadlineDate
			? new Date(t.deadlineDate as Date).toISOString().slice(0, 16) : '';
		rcN             = t.recurrenceConfig?.n ?? 7;
		rcDayOfMonth    = t.recurrenceConfig?.dayOfMonth ?? 1;
		rcDayOfWeek     = String(t.recurrenceConfig?.dayOfWeek ?? 1);
		const hour      = t.recurrenceConfig?.hour ?? 9;
		rcTime          = hour.toString().padStart(2, '0') + ':00';
	});

	// ##############################################
	// UI state
	// ##############################################

	let saving       = $state(false);
	let saveError    = $state('');
	let savedOk      = $state(false);
	let deleting     = $state(false);
	let assigneeOpen = $state(false);

	const sheetMembers = $derived.by(() => {
		if (members.length) return members;
		if (taskState.type === 'success') return [{ id: taskState.task.assignedTo, name: '—' }];
		return [{ id: currentUserId, name: '—' }];
	});
	const assignedName  = $derived(sheetMembers.find((m) => m.id === assignedTo)?.name ?? 'Select person…');
	const minDatetime   = new Date().toISOString().slice(0, 16);

	const weekdays = [
		{ label: 'Monday', value: 1 }, { label: 'Tuesday', value: 2 },
		{ label: 'Wednesday', value: 3 }, { label: 'Thursday', value: 4 },
		{ label: 'Friday', value: 5 }, { label: 'Saturday', value: 6 },
		{ label: 'Sunday', value: 0 },
	];

	const statusConfig: Record<string, { label: string; color: string; bg: string; ring: string }> = {
		pending:     { label: 'Pending',     color: 'var(--muted-foreground)',    bg: 'oklch(0.552 0.016 285.938 / 0.1)',  ring: 'oklch(0.552 0.016 285.938 / 0.3)'  },
		in_progress: { label: 'In Progress', color: 'var(--color-status-blue)',   bg: 'oklch(0.488 0.243 264.376 / 0.1)',  ring: 'oklch(0.488 0.243 264.376 / 0.35)' },
		done:        { label: 'Done',        color: 'var(--color-status-green)',  bg: 'oklch(0.627 0.194 142.495 / 0.1)',  ring: 'oklch(0.627 0.194 142.495 / 0.35)' },
		overdue:     { label: 'Overdue',     color: 'var(--color-status-red)',    bg: 'oklch(0.577 0.245 27.325 / 0.1)',   ring: 'oklch(0.577 0.245 27.325 / 0.35)'  },
		problem:     { label: 'Problem',     color: 'var(--color-status-yellow)', bg: 'oklch(0.795 0.184 86.047 / 0.1)',   ring: 'oklch(0.795 0.184 86.047 / 0.35)'  },
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
		if (!taskId) return;
		saving = true; saveError = ''; savedOk = false;
		const res = await fetch(`/api/tasks/${taskId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(buildPayload())
		});
		saving = false;
		if (res.ok) {
			const updated: Task = await res.json();
			taskState = { type: 'success', task: updated };
			savedOk = true;
			setTimeout(() => (savedOk = false), 2000);
			onupdated();
		} else {
			saveError = await res.text().catch(() => 'Failed to update task.');
		}
	}

	async function handleDelete() {
		if (!taskId || !confirm('Delete this task?')) return;
		deleting = true;
		await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
		ondeleted();
	}

	function autoResize(e: Event) {
		const el = e.currentTarget as HTMLTextAreaElement;
		el.style.height = 'auto';
		el.style.height = el.scrollHeight + 'px';
	}

	const open = $derived(!!taskId);
	function handleOpenChange(isOpen: boolean) { if (!isOpen) onclose(); }
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content>
		<!-- Header: Open link + Delete + Close -->
		<Sheet.Header>
			<div class="flex items-center justify-between">
				{#if taskId}
					<a
						href="/tasks/{taskId}"
						class="inline-flex items-center gap-1 text-[0.75rem] font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Open full view
						<ExternalLink class="size-3" />
					</a>
				{:else}
					<span></span>
				{/if}

				<div class="flex items-center gap-1">
					{#if userRole === 'admin' && taskState.type === 'success'}
						<button
							onclick={handleDelete}
							disabled={deleting}
							class="flex items-center gap-1 text-[0.75rem] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 px-2 py-1 rounded"
						>
							<Trash2 class="size-3.5" />
							{deleting ? 'Deleting…' : 'Delete'}
						</button>
					{/if}
					<button
						onclick={onclose}
						class="flex items-center justify-center size-7 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
						aria-label="Close"
					>
						<X class="size-4" />
					</button>
				</div>
			</div>
		</Sheet.Header>

		<!-- Body -->
		<div class="flex-1 overflow-y-auto px-6 py-5">
			{#if taskState.type === 'loading'}
				<div class="flex justify-center py-16 text-muted-foreground">
					<Loader2 class="size-5 animate-spin" />
				</div>

			{:else if taskState.type === 'error'}
				<p class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive">
					{taskState.message}
				</p>

			{:else if taskState.type === 'success'}
				<!-- Status pill strip -->
				<div class="flex items-center gap-1.5 flex-wrap mb-4">
					{#each Object.entries(statusConfig) as [key, cfg]}
						<button
							type="button"
							onclick={() => (status = key as typeof status)}
							class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium transition-all duration-150"
							style={status === key
								? `background: ${cfg.bg}; color: ${cfg.color}; box-shadow: 0 0 0 1px ${cfg.ring}`
								: 'color: var(--muted-foreground)'}
						>
							<span class="size-1.5 rounded-full shrink-0" style="background: {cfg.color}"></span>
							{cfg.label}
						</button>
					{/each}
				</div>

				<!-- Title with accent border -->
				<div
					class="pl-3 mb-6 transition-[border-color] duration-500"
					style="border-left: 3px solid {currentStatus.color}"
				>
					<textarea
						bind:value={title}
						oninput={autoResize}
						placeholder="Task title"
						rows={1}
						class="w-full resize-none bg-transparent text-[1.375rem] font-bold leading-snug text-foreground outline-none placeholder:text-muted-foreground/40 overflow-hidden"
						style="height: auto"
					></textarea>
				</div>

				<!-- Description -->
				<div class="mb-6">
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
						Description
					</p>
					<textarea
						bind:value={description}
						oninput={autoResize}
						placeholder="Add a description…"
						rows={3}
						class="w-full resize-none bg-transparent text-[0.875rem] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-border focus:border-foreground/30 transition-colors duration-200 pb-2"
					></textarea>
				</div>

				<!-- Assignee + Task type -->
				<div class="grid grid-cols-2 gap-4 mb-6">
					<div>
						<div class="flex items-center gap-1.5 mb-2">
							<User class="size-3 text-muted-foreground" />
							<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">Assignee</p>
						</div>
						{#if userRole === 'admin'}
							<Popover.Root bind:open={assigneeOpen}>
								<Popover.Trigger>
									<button
										type="button"
										class="flex w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-[0.8125rem] text-foreground hover:bg-muted/50 transition-colors"
									>
										<span class="truncate">{assignedName}</span>
										<ChevronsUpDown class="size-3.5 shrink-0 opacity-40 ml-1" />
									</button>
								</Popover.Trigger>
								<Popover.Content class="w-[260px] p-0">
									<Command.Root>
										<Command.Input placeholder="Search…" />
										<Command.List>
											<Command.Empty>No person found.</Command.Empty>
											<Command.Group>
												{#each sheetMembers as m}
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
							<p class="text-[0.875rem] py-1">{assignedName}</p>
						{/if}
					</div>

					<div>
						<div class="flex items-center gap-1.5 mb-2">
							<RefreshCw class="size-3 text-muted-foreground" />
							<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">Type</p>
						</div>
						<div class="flex gap-1.5">
							{#each [['once', 'One-time'], ['recurring', 'Recurring']] as [val, lbl]}
								<button
									type="button"
									onclick={() => (deadlineType = val as 'once' | 'recurring')}
									class="flex-1 rounded-lg border py-1.5 text-[0.75rem] font-medium transition-all duration-150
										{deadlineType === val
										? 'border-foreground bg-foreground text-background'
										: 'border-border bg-background text-muted-foreground hover:text-foreground'}"
								>
									{lbl}
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Deadline / Schedule -->
				<div class="mb-6">
					<div class="flex items-center gap-1.5 mb-2.5">
						<Calendar class="size-3 text-muted-foreground" />
						<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
							{deadlineType === 'once' ? 'Deadline' : 'Schedule'}
						</p>
					</div>

					{#if deadlineType === 'once'}
						<Input type="datetime-local" bind:value={deadlineDate} min={minDatetime} />
					{:else}
						<div class="space-y-3">
							<div>
								<p class="text-[0.75rem] text-muted-foreground mb-1.5">Recurrence type</p>
								<Select.Root bind:value={recurrenceType}>
									<Select.Trigger class="w-full">
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
								<div class="grid grid-cols-2 gap-3">
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
								<div class="grid grid-cols-2 gap-3">
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
								<div class="grid grid-cols-2 gap-3">
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
								<div>
									<p class="text-[0.75rem] text-muted-foreground mb-1.5">Time</p>
									<Input type="time" bind:value={rcTime} class="max-w-[8rem]" />
								</div>
							{/if}

							<div>
								<p class="text-[0.75rem] text-muted-foreground mb-1.5">
									Overall deadline <span class="opacity-60">(optional)</span>
								</p>
								<Input type="datetime-local" bind:value={overallDeadlineDate} />
							</div>
						</div>
					{/if}
				</div>

				<!-- Save bar -->
				{#if saveError}
					<p class="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-[0.8125rem] text-destructive mb-3">
						{saveError}
					</p>
				{/if}

				<div class="flex items-center gap-3">
					<Button onclick={handleSave} disabled={saving} class="min-w-[8rem]">
						{saving ? 'Saving…' : 'Save changes'}
					</Button>
					{#if savedOk}
						<span
							class="flex items-center gap-1.5 text-[0.8125rem] font-medium"
							style="color: var(--color-status-green)"
						>
							<Check class="size-3.5" />
							Saved
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
