export const handleApiError = (error, setAlert, setPreferenceError) => {
  const message = error.response
    ? `${error.response.data?.details || error.response.data?.error || 'Erro ao processar a requisição.'}`
    : `Erro: ${error.message}`;
  if (
    message.includes('fora de suas preferências') ||
    message.includes('não está entre suas preferências de dias') ||
    message.includes('Conflito de horário detectado') ||
    message.includes('deve ser alterada para outro horário ou dia.') ||
    message.includes('Conflito detectado') ||
    message.includes('ministra a disciplina') ||
    message.includes('tem aula tarde da noite')
  ) {
    setPreferenceError(message);
  } else {
    setAlert({ message, type: 'error' });
  }
  return { message, type: 'error' };
};