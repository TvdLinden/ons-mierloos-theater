export default function Footer() {
  return (
    <footer className="w-full bg-primary dark:bg-accent py-6 mt-auto shadow-lg">
      <div className="max-w-4xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between text-secondary">
        <span className="font-display">
          &copy; {new Date().getFullYear()} Ons Mierloos Theater. All rights reserved.
        </span>
        <span id="contact" className="font-medium">
          Contact: info@onsmierloostheater.nl
        </span>
      </div>
    </footer>
  );
}
