import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AccountProfileForm } from "@/components/account-profile-form";
import { AccountPasswordForm } from "@/components/account-password-form";
import { AccountAvatarUpload } from "@/components/account-avatar-upload";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login");

  const memberSince = user.createdAt.toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile, security, and preferences
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <AccountAvatarUpload
            image={user.image}
            name={user.name ?? ""}
          />
          <AccountProfileForm
            name={user.name ?? ""}
            email={user.email}
            memberSince={memberSince}
          />
        </div>
        <div className="space-y-6">
          <ThemeSwitcher />
          <AccountPasswordForm hasPassword={!!user.password} />
        </div>
      </div>
    </div>
  );
}
