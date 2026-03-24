import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            404
          </h1>
          <h2 className="text-2xl font-bold tracking-tight">Página não encontrada</h2>
          <p className="text-muted-foreground">
            Oops! A página que você está procurando não existe ou foi movida.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/courses">
              <Search className="h-4 w-4" />
              Ver Cursos
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;