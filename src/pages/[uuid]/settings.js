import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    Box,
    Container,
    Typography,
    Grid,
    Card,
    CardContent,
    FormControlLabel,
    Checkbox,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { DashboardLayout } from '../../components/dashboard-layout';
import { useAuthContext } from '../../contexts/auth-context';
import { PortfolioSidebar } from '../../components/portfolios/details/portfolio-sidebar';
import { useEffect, useState } from 'react';
import axios from 'axios';

const SettingsPage = () => {
    const router = useRouter();
    const { uuid } = router.query;
    const { isLoading, isAuthenticated } = useAuthContext();

    const [settings, setSettings] = useState(null);
    const [initialSettings, setInitialSettings] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!uuid) return;
        axios.get(`/api/portfolios/${uuid}/settings`)
            .then(res => {
                setSettings(res.data);
                setInitialSettings(res.data);
            })
            .catch(err => {
                setError('Не удалось загрузить настройки');
            });
    }, [uuid]);

    const hasChanges = settings && initialSettings &&
        JSON.stringify(settings) !== JSON.stringify(initialSettings);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const res = await axios.put(`/api/portfolios/${uuid}/settings`, settings);
            setInitialSettings(res.data);
            setSettings(res.data);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Не удалось сохранить настройки');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading || !isAuthenticated) {
        return null;
    }

    return (
        <>
            <Head>
                <title>Настройки | Profit Case</title>
            </Head>
            <Box
                component="main"
                sx={{ flexGrow: 1 }}
                style={{ paddingTop: 80, paddingBottom: 16, height: '100vh', overflow: 'hidden', boxSizing: 'border-box' }}
            >
                <Container maxWidth={false} sx={{ px: 3, height: '100%', overflow: 'hidden' }}>
                    <Grid container spacing={3} sx={{ height: '100%', minHeight: 0 }}>
                        <Grid item sx={{ display: 'flex' }}>
                            <PortfolioSidebar />
                        </Grid>
                        <Grid item xs sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                            <Typography variant="h4" sx={{ mb: 3 }}>
                                Настройки
                            </Typography>

                            {!settings ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Card sx={{ maxWidth: 600 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ mb: 2 }}>
                                            ИИ-помощник
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={settings.send_news_to_ai}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        send_news_to_ai: e.target.checked
                                                    })}
                                                />
                                            }
                                            label="Передавать актуальные новости рынка в чат с ИИ"
                                        />

                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 3 }}>
                                            Если включено, ИИ-помощник будет получать последние новости,
                                            влияющие на Московскую биржу, для более точных рекомендаций.
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={settings.send_fundamentals_to_ai}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        send_fundamentals_to_ai: e.target.checked
                                                    })}
                                                />
                                            }
                                            label="Передавать фундаментальные показатели компаний в чат с ИИ"
                                        />

                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 3 }}>
                                            Если включено, ИИ-помощник будет получать P/E, P/S, EV/EBITDA,
                                            ROE, дивдоходность и другие показатели бумаг из вашего портфеля.
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={settings.send_macro_to_ai}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        send_macro_to_ai: e.target.checked
                                                    })}
                                                />
                                            }
                                            label="Передавать макроэкономические показатели в чат с ИИ"
                                        />

                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 3 }}>
                                            Если включено, ИИ-помощник будет получать ключевую ставку ЦБ,
                                            курсы валют, цену нефти Brent, золото и индексы (IMOEX, RGBI).
                                            Данные обновляются каждые 10 минут.
                                        </Typography>

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={settings.send_quotes_to_ai}
                                                    onChange={(e) => setSettings({
                                                        ...settings,
                                                        send_quotes_to_ai: e.target.checked
                                                    })}
                                                />
                                            }
                                            label="Передавать текущие котировки бумаг портфеля в чат с ИИ"
                                        />

                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 3 }}>
                                            Если включено, ИИ-помощник будет получать актуальные цены
                                            акций, которые есть в вашем портфеле (MOEX).
                                        </Typography>

                                        {error && (
                                            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                                        )}
                                        {success && (
                                            <Alert severity="success" sx={{ mb: 2 }}>Настройки сохранены</Alert>
                                        )}

                                        <Button
                                            variant="contained"
                                            onClick={handleSave}
                                            disabled={!hasChanges || saving}
                                        >
                                            {saving ? <CircularProgress size={24} /> : 'Сохранить'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            )}
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </>
    );
};

SettingsPage.getLayout = (page) => (
    <DashboardLayout>{page}</DashboardLayout>
);

export default SettingsPage;
