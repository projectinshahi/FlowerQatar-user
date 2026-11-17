import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-guard";
import ProfileForm from "@/components/account/ProfileForm";
import ChangePasswordCard from "@/components/account/ChangePasswordCard";
import PrivacySecurity from "@/components/account/PrivacySecurity";

export const metadata = { title: "My Profile" };

export default async function ProfilePage() {
  // The account layout already guards auth; here we only need to know whether the
  // customer has a password (social-only accounts can't "change" a password they never set).
  const user = await getCurrentCustomer();
  const dbUser = user ? await prisma.user.findUnique({ where: { id: user.id }, select: { password: true } }) : null;
  const hasPassword = Boolean(dbUser?.password);

  return (
    <div className="space-y-10">
      <ProfileForm />
      {hasPassword && <ChangePasswordCard />}
      <PrivacySecurity hasPassword={hasPassword} />
    </div>
  );
}
