suite('Тесты страницы О...', function(){
	test('Страницы должна содержать ссылку на страницу контактов', function(){
		assert($('a[href="/contact"]').length);
	});
});
