import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="h-full w-full">
      {/* pseudo-background */}
      <div className="fixed top-0 left-0 -z-10 h-full w-full bg-white dark:bg-black opacity-95" />
      <Outlet />
      {/*<TanstackDevtools
        config={{
          position: "bottom-left",
        }}
        plugins={[
          {
            name: "Tanstack Router",
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />*/}
    </div>
  ),
});
