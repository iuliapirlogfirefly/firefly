import { BusinessHeader } from "./business-header";
import { BusinessSidebar } from "./business-sidebar";

type Props = {
  venueName: string;
  children: React.ReactNode;
};

export function BusinessShell({ venueName, children }: Props) {
  return (
    <div className="flex min-h-screen bg-background">
      <BusinessSidebar venueName={venueName} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-0">
        <BusinessHeader />
        <div className="flex-1 px-4 py-6 pt-16 lg:px-8 lg:py-8 lg:pt-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
