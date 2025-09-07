// Preenche o campo de destino usando a posição
console.log('Preenchendo campo de destino...');
const inputFields = await page.$$('input[placeholder*="Cidade"]');
if (inputFields.length > 1) {
    await inputFields[1].click({ clickCount: 3 });
    await delay(1000);
    await page.keyboard.type(destination, { delay: 200 });
    await delay(2000);
    await page.keyboard.press('Enter');
    await delay(2000);
} else {
    console.error('Campo de destino não encontrado.');
    throw new Error('Campo de destino não encontrado.');
}
