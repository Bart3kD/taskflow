<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { LayoutDashboard, CheckSquare, Users, LogOut, Settings, Menu } from 'lucide-svelte';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	let sidebarOpen = $state(false);

	const allNavItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
		{ href: '/tasks', label: 'Tasks', icon: CheckSquare, adminOnly: false },
		{ href: '/team', label: 'Team', icon: Users, adminOnly: true },
		{ href: '/settings', label: 'Settings', icon: Settings, adminOnly: false }
	];

	const navItems = $derived(
		allNavItems.filter((item) => !item.adminOnly || data.user.role === 'admin')
	);

	async function logout() {
		await fetch('/api/auth/logout', { method: 'POST' });
		goto('/login');
	}

	function isActive(href: string) {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	function initials(name: string) {
		return name.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
	}

	function closeSidebar() {
		sidebarOpen = false;
	}
</script>

<div class="flex h-screen bg-background">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<div
			class="fixed inset-0 z-30 bg-black/50 md:hidden"
			onclick={closeSidebar}
			aria-hidden="true"
		></div>
	{/if}

	<!-- Sidebar -->
	<aside
		class="fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-border bg-sidebar
			transition-transform duration-200 ease-in-out
			md:static md:translate-x-0
			{sidebarOpen ? 'translate-x-0' : '-translate-x-full'}"
	>
		<div class="flex h-14 items-center border-b border-sidebar-border px-4">
			<span class="text-[1rem] font-semibold text-sidebar-foreground">TaskFlow</span>
		</div>

		<nav class="flex flex-1 flex-col gap-1 p-2">
			{#each navItems as item}
				<a
					href={item.href}
					onclick={closeSidebar}
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
			<div class="mb-2 flex items-center gap-2.5 px-3 py-1">
				<div class="size-7 rounded-full overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
					{#if data.user.avatarUrl}
						<img src={data.user.avatarUrl} alt={data.user.name} class="size-full object-cover" />
					{:else}
						<span class="text-primary text-[0.625rem] font-bold leading-none">{initials(data.user.name)}</span>
					{/if}
				</div>
				<div class="min-w-0">
					<p class="text-[0.75rem] font-medium text-sidebar-foreground truncate">{data.user.name}</p>
					<p class="text-[0.6875rem] text-muted-foreground capitalize">{data.user.role}</p>
				</div>
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
	<main class="flex min-w-0 flex-1 flex-col overflow-hidden">
		<!-- Mobile topbar -->
		<div class="flex h-14 shrink-0 items-center border-b border-border px-4 md:hidden">
			<button
				onclick={() => (sidebarOpen = !sidebarOpen)}
				class="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
				aria-label="Toggle menu"
			>
				<Menu class="size-5" />
			</button>
			<span class="ml-3 text-[1rem] font-semibold">TaskFlow</span>
		</div>
		<div class="flex-1 overflow-y-auto p-4 md:p-6">
			{@render children()}
		</div>
	</main>
</div>
