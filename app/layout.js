import "./globals.css";

export const metadata = {
  title: "Formatador de Documentos",
  description: "Formate documentos com IA usando modelos personalizados",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
