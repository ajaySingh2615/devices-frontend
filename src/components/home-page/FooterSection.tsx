"use client";

interface FooterSectionProps {
  scrollY: number;
}

export function FooterSection({ scrollY }: FooterSectionProps) {
  return (
    <footer className="home-footer">
      <div className="home-container">
        <div className="home-footer-grid">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">D</span>
              </div>
              <span className="text-xl font-bold font-display">DeviceHub</span>
            </div>
            <p className="text-white/70">
              Premium refurbished electronics with quality guarantee and
              warranty.
            </p>
          </div>

          <FooterCol
            title="Company"
            items={["About Us", "Careers", "Press", "Contact"]}
          />
          <FooterCol
            title="Support"
            items={["Help Center", "Returns", "Warranty", "Shipping"]}
          />
          <FooterCol
            title="Legal"
            items={["Terms of Service", "Privacy Policy", "Cookie Policy"]}
          />
        </div>

        <div className="home-footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} DeviceHub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-2 text-white/70">
        {items.map((t) => (
          <li key={t}>
            <a href="#" className="hover:text-white">
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
