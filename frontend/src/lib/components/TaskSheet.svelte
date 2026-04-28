<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import TaskForm from '$lib/components/TaskForm.svelte';
	import { ExternalLink, Trash2, Loader2 } from 'lucide-svelte';
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

	let { taskId, members, currentUserId, userRole, onclose, onupdated, ondeleted }: Props =
		$props();

	type TaskState =
		| { type: 'idle' }
		| { type: 'loading' }
		| { type: 'success'; task: Task }
		| { type: 'error'; message: string };

	let taskState = $state<TaskState>({ type: 'idle' });
	let saving = $state(false);
	let deleting = $state(false);
	let saveError = $state('');
	let savedOk = $state(false);

	$effect(() => {
		if (!taskId) {
			taskState = { type: 'idle' };
			return;
		}
		taskState = { type: 'loading' };
		saveError = '';
		savedOk = false;
		fetch(`/api/tasks/${taskId}`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((task: Task) => {
				taskState = { type: 'success', task };
			})
			.catch(() => {
				taskState = { type: 'error', message: 'Failed to load task.' };
			});
	});

	async function handleSave(payload: Record<string, unknown>) {
		if (!taskId) return;
		saving = true;
		saveError = '';
		savedOk = false;
		const res = await fetch(`/api/tasks/${taskId}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		saving = false;
		if (res.ok) {
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

	const open = $derived(!!taskId);

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) onclose();
	}

	const sheetMembers = $derived.by(() => {
		if (members.length) return members;
		if (taskState.type === 'success') return [{ id: taskState.task.assignedTo, name: '—' }];
		return [];
	});
</script>

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content>
		<Sheet.Header>
			<div class="flex items-start justify-between gap-3 pr-8">
				<Sheet.Title class="leading-snug">
					{#if taskState.type === 'success'}
						{taskState.task.title}
					{:else if taskState.type === 'loading'}
						<span class="text-muted-foreground">Loading…</span>
					{:else}
						Task
					{/if}
				</Sheet.Title>
				<div class="flex items-center gap-1.5 shrink-0">
					{#if taskId}
						<a
							href="/tasks/{taskId}"
							class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.75rem] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
						>
							Open
							<ExternalLink class="size-3" />
						</a>
					{/if}
					{#if userRole === 'admin' && taskState.type === 'success'}
						<Button
							variant="ghost"
							size="icon-sm"
							class="text-destructive hover:text-destructive hover:bg-destructive/10"
							onclick={handleDelete}
							disabled={deleting}
						>
							<Trash2 class="size-3.5" />
						</Button>
					{/if}
				</div>
			</div>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
			{#if taskState.type === 'loading'}
				<div class="flex justify-center py-12 text-muted-foreground">
					<Loader2 class="size-5 animate-spin" />
				</div>
			{:else if taskState.type === 'error'}
				<p
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive"
				>
					{taskState.message}
				</p>
			{:else if taskState.type === 'success'}
				{#if saveError}
					<p
						class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-[0.875rem] text-destructive"
					>
						{saveError}
					</p>
				{/if}
				{#if savedOk}
					<p
						class="rounded-lg border border-[var(--color-status-green)]/40 bg-[var(--color-status-green)]/10 px-4 py-3 text-[0.875rem] text-[var(--color-status-green)]"
					>
						Saved successfully.
					</p>
				{/if}
				<TaskForm
					members={sheetMembers}
					{currentUserId}
					task={taskState.task}
					loading={saving}
					bare
					onsubmit={handleSave}
				/>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
