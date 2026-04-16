<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { untrack } from 'svelte';
	import type { Task } from '$lib/db/schema';

	type Props = {
		members: { id: string; name: string }[];
		loading: boolean;
		task?: Pick<Task, 'title' | 'description' | 'assignedTo' | 'deadlineType' | 'recurrenceType' | 'deadlineDate' | 'recurrenceConfig' | 'status'>;
		onsubmit: (payload: Record<string, unknown>) => void;
	};

	let { members, loading, task, onsubmit }: Props = $props();

	let title = $state(untrack(() => task?.title ?? ''));
	let description = $state(untrack(() => task?.description ?? ''));
	let assignedTo = $state(untrack(() => task?.assignedTo ?? members[0]?.id ?? ''));
	let deadlineType = $state<'once' | 'recurring'>(untrack(() => task?.deadlineType ?? 'once'));
	let recurrenceType = $state(untrack(() => task?.recurrenceType ?? 'every_n_days'));
	let deadlineDate = $state(
		untrack(() => task?.deadlineDate ? new Date(task.deadlineDate as Date).toISOString().slice(0, 16) : '')
	);
	let status = $state(untrack(() => task?.status ?? 'pending'));

	// Recurrence config
	let rcN = $state(untrack(() => task?.recurrenceConfig?.n ?? 7));
	let rcDayOfMonth = $state(untrack(() => task?.recurrenceConfig?.dayOfMonth ?? 1));
	let rcDayOfWeek = $state(untrack(() => task?.recurrenceConfig?.dayOfWeek ?? 1));
	let rcHour = $state(untrack(() => task?.recurrenceConfig?.hour ?? 9));

	const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

	function buildPayload() {
		const base: Record<string, unknown> = { title, assignedTo, deadlineType };
		if (description) base.description = description;
		if (task) base.status = status;

		if (deadlineType === 'once') {
			if (deadlineDate) base.deadlineDate = new Date(deadlineDate).toISOString();
		} else {
			base.recurrenceType = recurrenceType;
			if (recurrenceType === 'every_n_days') base.recurrenceConfig = { n: rcN };
			else if (recurrenceType === 'day_of_month') base.recurrenceConfig = { dayOfMonth: rcDayOfMonth, hour: rcHour };
			else if (recurrenceType === 'day_of_week') base.recurrenceConfig = { dayOfWeek: rcDayOfWeek, hour: rcHour };
			else base.recurrenceConfig = { hour: rcHour };
		}

		return base;
	}

	function submit(e: SubmitEvent) {
		e.preventDefault();
		onsubmit(buildPayload());
	}
</script>

<form onsubmit={submit} class="space-y-5 rounded-xl border border-border bg-card p-6">
	<div class="space-y-1.5">
		<Label for="title">Title *</Label>
		<Input id="title" bind:value={title} placeholder="Task title" required />
	</div>

	<div class="space-y-1.5">
		<Label for="desc">Description</Label>
		<Textarea id="desc" bind:value={description} placeholder="Optional description" rows={3} />
	</div>

	<div class="space-y-1.5">
		<Label for="assignee">Assigned to *</Label>
		<select
			id="assignee"
			bind:value={assignedTo}
			required
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem] text-foreground"
		>
			{#each members as m}
				<option value={m.id}>{m.name}</option>
			{/each}
		</select>
	</div>

	{#if task}
		<div class="space-y-1.5">
			<Label for="status">Status</Label>
			<select
				id="status"
				bind:value={status}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem] text-foreground"
			>
				<option value="pending">Pending</option>
				<option value="in_progress">In Progress</option>
				<option value="done">Done</option>
				<option value="overdue">Overdue</option>
			</select>
		</div>
	{/if}

	<!-- Deadline type toggle -->
	<div class="space-y-3">
		<Label>Deadline type</Label>
		<div class="flex gap-2">
			{#each [['once', 'One-time'], ['recurring', 'Recurring']] as [val, label]}
				<button
					type="button"
					onclick={() => (deadlineType = val as 'once' | 'recurring')}
					class="rounded-md border px-4 py-2 text-[0.875rem] font-medium transition-colors
						{deadlineType === val
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border bg-background text-foreground hover:bg-muted'}"
				>
					{label}
				</button>
			{/each}
		</div>
	</div>

	{#if deadlineType === 'once'}
		<div class="space-y-1.5">
			<Label for="deadline">Deadline date & time</Label>
			<Input id="deadline" type="datetime-local" bind:value={deadlineDate} />
		</div>
	{:else}
		<div class="space-y-1.5">
			<Label for="rectype">Recurrence type</Label>
			<select
				id="rectype"
				bind:value={recurrenceType}
				class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem] text-foreground"
			>
				<option value="every_n_days">Every N days</option>
				<option value="day_of_month">Day of month</option>
				<option value="day_of_week">Day of week</option>
				<option value="first_day_of_month">First day of month</option>
				<option value="last_day_of_month">Last day of month</option>
			</select>
		</div>

		{#if recurrenceType === 'every_n_days'}
			<div class="space-y-1.5">
				<Label for="rcN">Every N days</Label>
				<Input id="rcN" type="number" min="1" bind:value={rcN} />
			</div>
		{:else if recurrenceType === 'day_of_month'}
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="rcDom">Day of month</Label>
					<Input id="rcDom" type="number" min="1" max="31" bind:value={rcDayOfMonth} />
				</div>
				<div class="space-y-1.5">
					<Label for="rcHour1">Hour</Label>
					<Input id="rcHour1" type="number" min="0" max="23" bind:value={rcHour} />
				</div>
			</div>
		{:else if recurrenceType === 'day_of_week'}
			<div class="grid grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<Label for="rcDow">Day of week</Label>
					<select
						id="rcDow"
						bind:value={rcDayOfWeek}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-[0.875rem] text-foreground"
					>
						{#each weekdays as day, i}
							<option value={i}>{day}</option>
						{/each}
					</select>
				</div>
				<div class="space-y-1.5">
					<Label for="rcHour2">Hour</Label>
					<Input id="rcHour2" type="number" min="0" max="23" bind:value={rcHour} />
				</div>
			</div>
		{:else}
			<div class="space-y-1.5">
				<Label for="rcHour3">Hour</Label>
				<Input id="rcHour3" type="number" min="0" max="23" bind:value={rcHour} />
			</div>
		{/if}
	{/if}

	<Button type="submit" disabled={loading} class="w-full">
		{loading ? 'Saving…' : task ? 'Save changes' : 'Create task'}
	</Button>
</form>
