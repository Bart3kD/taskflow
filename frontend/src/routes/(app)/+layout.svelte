<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { LayoutDashboard, CheckSquare, Users, LogOut } from 'lucide-svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/tasks', label: 'Tasks', icon: CheckSquare },
		{ href: '/team', label: 'Team', icon: Users }
	];

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}
</script>

<div class="flex h-screen bg-background">
	<!-- Sidebar -->
	<aside class="flex w-56 flex-col border-r border-border bg-sidebar">
		<div class="flex h-14 items-center border-b border-sidebar-border px-4">
			<span class="text-[1rem] font-semibold text-sidebar-foreground">TaskFlow</span>
		</div>

		<nav class="flex flex-1 flex-col gap-1 p-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center gap-2.5 rounded-md px-3 py-2 text-[0.875rem] font-medium transition-colors
						{isActive(item.href)
						? 'bg-sidebar-accent text-sidebar-accent-foreground'
						: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
				>
					<item.icon class="size-4 shrink-0" />
					{item.label}
				</a>
			{/each}
		</nav>

		<div class="border-t border-sidebar-border p-3">
			<div class="mb-2 px-3 py-1">
				<p class="text-[0.75rem] font-medium text-sidebar-foreground">{data.user.name}</p>
				<p class="text-[0.6875rem] text-muted-foreground capitalize">{data.user.role}</p>
			</div>
			<button
				onclick={logout}
				class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-[0.875rem] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
			>
				<LogOut class="size-4" />
				Log out
			</button>
		</div>
	</aside>

	<!-- Main content -->
	<main class="flex flex-1 flex-col overflow-hidden">
		<div class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</div>
	</main>
</div>
