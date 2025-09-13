import { Logo } from './Logo';

export default function LogoWithText() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-8">
      {/* Main Logo Display */}
      <div className="text-center space-y-12">
        {/* Extra Large Logo */}
        <Logo size="xl" />

      </div>
    </div>
  );
}