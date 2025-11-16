import { Logo } from './Logo';

export default function LogoWithText() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-12">
        <Logo size="xl" />

      </div>
    </div>
  );
}