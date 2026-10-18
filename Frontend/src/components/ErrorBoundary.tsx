import { Component, ErrorInfo, ReactNode } from 'react';
import { Card, Button, Container } from 'react-bootstrap';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    }

    private handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Container className="d-flex justify-content-center align-items-center min-vh-100 py-4">
                    <Card className="shadow-lg text-center p-4 border-0 style-card-error" style={{ maxWidth: '500px' }}>
                        <Card.Body>
                            <div className="mb-3 text-danger fs-1">⚠️</div>
                            <Card.Title className="fw-bold mb-3 fs-4">Aviso de Recuperación</Card.Title>
                            <Card.Text className="text-muted mb-4">
                                Se produjo una interrupción momentánea en la carga de la pantalla. Los datos están seguros en la base de datos.
                            </Card.Text>
                            <Button variant="primary" onClick={this.handleReload} className="px-4 py-2 fw-bold">
                                Recargar Vista
                            </Button>
                        </Card.Body>
                    </Card>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
