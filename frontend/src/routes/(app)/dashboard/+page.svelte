<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import FacetedFilter from '$lib/components/FacetedFilter.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl.svelte';
	import TaskSheet from '$lib/components/TaskSheet.svelte';
	import { invalidateAll } from '$app/navigation';
	import { Plus, AlertCircle, Play, Trash2, Search } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let schedulerRunning = $state(false);
	let schedulerResult = $state<'ok' | 'error' | null>(null);
	let clearingLogs = $state(false);

	async function runScheduler() {
		schedulerRunning = true;
		schedulerResult = null;
		try {
			const res = await fetch('/api/scheduler', { method: 'POST' });
			schedulerResult = res.ok ? 'ok' : 'error';
		} catch {
			schedulerResult = 'error';
		} finally {
			schedulerRunning = false;
		}
	}

	async function clearReminderLogs() {
		clearingLogs = true;
		try {
			await fetch('/api/scheduler/logs', { method: 'DELETE' });
		} finally {
			clearingLogs = false;
		}
	}

	let search = $state('');
	let filterStatus = $state<string[]>([]);
	let filterMember = $state<string[]>([]);
	let filterPeriod = $state<'week' | 'month' | 'all'>('week');
	let sortDeadline = $state<'asc' | 'desc' | null>(null);

	function periodBounds(period: 'week' | 'month' | 'all'): { start: Date; end: Date } | null {
		if (period === 'all') return null;
		const now = new Date();
		if (period === 'week') {
			const day = now.getDay();
			const monday = new Date(now);
			monday.setDate(now.getDate() - ((day + 6) % 7));
			monday.setHours(0, 0, 0, 0);
			const sunday = new Date(monday);
			sunday.setDate(monday.getDate() + 6);
			sunday.setHours(23, 59, 59, 999);
			return { start: monday, end: sunday };
		}
		const start = new Date(now.getFullYear(), now.getMonth(), 1);
		const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
		return { start, end };
	}

	const periodOptions: Array<{ value: 'week' | 'month' | 'all'; label: string }> = [
		{ value: 'week', label: 'This week' },
		{ value: 'month', label: 'This month' },
		{ value: 'all', label: 'All' }
	];

	const statusConfig: Record<string, { label: string; dot: string; badge: string }> = {
		pending: {
			label: 'Pending',
			dot: 'bg-muted-foreground/50',
			badge: 'bg-muted text-muted-foreground'
		},
		in_progress: {
			label: 'In Progress',
			dot: 'bg-[var(--color-status-blue)]',
			badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
		},
		done: {
			label: 'Done',
			dot: 'bg-[var(--color-status-green)]',
			badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
		},
		overdue: {
			label: 'Overdue',
			dot: 'bg-[var(--color-status-red)]',
			badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
		},
		problem: {
			label: 'Problem',
			dot: 'bg-[var(--color-status-yellow)]',
			badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
		}
	};

	const statusOptions = Object.entries(statusConfig).map(([value, { label }]) => ({ value, label }));
	const memberOptions = $derived(data.members.map((m) => ({ value: m.id, label: m.name })));

	const filtered = $derived.by(() => {
		const bounds = periodBounds(filterPeriod);
		const result = data.tasks.filter((t) => {
			if (filterStatus.length && !filterStatus.includes(t.status)) return false;
			if (filterMember.length && !filterMember.includes(t.assignedTo)) return false;
			if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
			if (bounds) {
				if (!t.deadlineDate) return false;
				const d = new Date(t.deadlineDate).getTime();
				if (d < bounds.start.getTime() || d > bounds.end.getTime()) return false;
			}
			return true;
		});
		if (sortDeadline) {
			result.sort((a, b) => {
				const da = a.deadlineDate ? new Date(a.deadlineDate).getTime() : Infinity;
				const db = b.deadlineDate ? new Date(b.deadlineDate).getTime() : Infinity;
				return sortDeadline === 'asc' ? da - db : db - da;
			});
		}
		return result;
	});

	const counts = $derived.by(() => {
		const c = { pending: 0, in_progress: 0, done: 0, overdue: 0, problem: 0 };
		for (const t of data.tasks) {
			if (t.status in c) c[t.status as keyof typeof c]++;
		}
		return c;
	});

	const hasFilters = $derived(
		filterStatus.length > 0 || filterMember.length > 0 || !!search
	);

	let selectedTaskId = $state<string | null>(null);

	function clearFilters() {
		filterStatus = [];
		filterMember = [];
		search = '';
	}

	function formatDate(d: Date | null) {
		if (!d) return '—';
		const dt = new Date(d);
		const date = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
		const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
		return `${date}, ${time}`;
	}

	function isOverdue(t: (typeof data.tasks)[0]) {
		if (t.status === 'done') return false;
		if (!t.deadlineDate) return false;
		return new Date(t.deadlineDate) < new Date();
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between gap-4">
		<div>
			<h1 class="text-[1.75rem] font-bold leading-tight">Dashboard</h1>
			<p class="text-[0.875rem] text-muted-foreground mt-0.5">
				{data.tasks.length} task{data.tasks.length === 1 ? '' : 's'} total
			</p>
		</div>

		{#if data.user.role === 'admin'}
			<div class="flex flex-wrap items-center gap-2 shrink-0">
				<Button
					variant="outline"
					size="sm"
					onclick={clearReminderLogs}
					disabled={clearingLogs}
					class="gap-1.5 text-muted-foreground"
				>
					<Trash2 class="size-3.5" />
					{clearingLogs ? 'Clearing…' : 'Clear logs'}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={runScheduler}
					disabled={schedulerRunning}
					class="gap-1.5 {schedulerResult === 'ok'
						? 'border-[var(--color-status-green)] text-[var(--color-status-green)]'
						: schedulerResult === 'error'
							? 'border-destructive text-destructive'
							: 'text-muted-foreground'}"
				>
					<Play class="size-3.5" />
					{schedulerRunning
						? 'Running…'
						: schedulerResult === 'ok'
							? 'Done'
							: schedulerResult === 'error'
								? 'Error'
								: 'Run scheduler'}
				</Button>
				<Button href="/tasks/new" class="gap-1.5">
					<Plus class="size-4" />
					New task
				</Button>
			</div>
		{/if}
	</div>

	<!-- Stat cards -->
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
		{#each Object.entries(counts) as [status, count]}
			{@const cfg = statusConfig[status]}
			<button
				onclick={() => {
					filterStatus = filterStatus.includes(status)
						? filterStatus.filter((s) => s !== status)
						: [...filterStatus, status];
				}}
				class="rounded-xl border border-border bg-card p-4 text-left transition-all hover:bg-accent
					{filterStatus.includes(status) ? 'ring-2 ring-ring bg-accent' : ''}"
			>
				<div class="flex items-center gap-1.5 mb-3">
					<span class="size-1.5 rounded-full shrink-0 {cfg.dot}"></span>
					<p class="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
						{cfg.label}
					</p>
				</div>
				<p class="text-[1.75rem] font-bold leading-none tabular-nums">{count}</p>
			</button>
		{/each}
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-2">
		<div class="relative">
			<Search
				class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
			/>
			<input
				bind:value={search}
				placeholder="Search tasks…"
				class="rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-[0.875rem] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
			/>
		</div>

		<SegmentedControl options={periodOptions} bind:value={filterPeriod} />

		<FacetedFilter label="Status" options={statusOptions} bind:selected={filterStatus} />

		{#if data.user.role === 'admin' && data.members.length > 0}
			<FacetedFilter label="Member" options={memberOptions} bind:selected={filterMember} />
		{/if}

		{#if hasFilters}
			<button
				onclick={clearFilters}
				class="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
			>
				Clear filters
			</button>
		{/if}
	</div>

	<!-- Task table -->
	<div class="rounded-xl border border-border bg-card overflow-hidden">
		<div class="overflow-x-auto">
		{#if filtered.length === 0}
			<div class="flex flex-col items-center gap-3 py-20 text-muted-foreground">
				<AlertCircle class="size-7 opacity-40" />
				{#if hasFilters}
					<div class="text-center space-y-1">
						<p class="text-[0.875rem]">
							{data.tasks.length} task{data.tasks.length === 1 ? '' : 's'} hidden by filters
						</p>
					</div>
					<Button variant="outline" size="sm" onclick={clearFilters}>Clear filters</Button>
				{:else}
					<p class="text-[0.875rem]">No tasks yet.</p>
					{#if data.user.role === 'admin'}
						<Button href="/tasks/new" size="sm" class="gap-1.5">
							<Plus class="size-3.5" />
							Create first task
						</Button>
					{/if}
				{/if}
			</div>
		{:else}
			<table class="w-full text-[0.875rem]">
				<thead>
					<tr class="border-b border-border bg-muted/30">
						<th
							class="px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground"
							>Title</th
						>
						{#if data.user.role === 'admin'}
							<th
								class="px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground"
								>Assignee</th
							>
						{/if}
						<th
							class="px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground"
							>Status</th
						>
						<th
							class="px-4 py-3 text-left text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
							onclick={() =>
								(sortDeadline =
									sortDeadline === 'asc' ? 'desc' : sortDeadline === 'desc' ? null : 'asc')}
						>
							Deadline
							<span class="ml-0.5 opacity-50"
								>{sortDeadline === 'asc' ? '↑' : sortDeadline === 'desc' ? '↓' : '↕'}</span
							>
						</th>
					</tr>
				</thead>
				<tbody>
					{#each filtered as task}
						<tr
							onclick={() => (selectedTaskId = task.id)}
							class="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer
								{isOverdue(task) ? 'bg-destructive/5 dark:bg-destructive/10' : ''}
								{selectedTaskId === task.id ? 'bg-muted/40' : ''}"
						>
							<td class="px-4 py-3 font-medium">
								<div class="flex items-center gap-2">
									{#if isOverdue(task)}
										<span class="size-1.5 rounded-full bg-destructive shrink-0"></span>
									{/if}
									{task.title}
								</div>
							</td>
							{#if data.user.role === 'admin'}
								<td class="px-4 py-3 text-muted-foreground">{task.assigneeName ?? '—'}</td>
							{/if}
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium {statusConfig[
										task.status
									]?.badge ?? 'bg-muted text-muted-foreground'}"
								>
									{statusConfig[task.status]?.label ?? task.status}
								</span>
							</td>
							<td class="px-4 py-3 text-muted-foreground tabular-nums"
								>{formatDate(task.deadlineDate)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		</div>
	</div>

	{#if filtered.length > 0}
		<p class="text-[0.75rem] text-muted-foreground text-right">
			Showing {filtered.length} of {data.tasks.length} task{data.tasks.length === 1 ? '' : 's'}
		</p>
	{/if}
</div>

<TaskSheet
	taskId={selectedTaskId}
	members={data.members}
	currentUserId={data.user.id}
	userRole={data.user.role}
	onclose={() => (selectedTaskId = null)}
	onupdated={async () => { await invalidateAll(); }}
	ondeleted={async () => { selectedTaskId = null; await invalidateAll(); }}
/>
