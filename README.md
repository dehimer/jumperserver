# jumperserver
Part of hardware project

<pre>
	<b>TODO</b>

	1.	подготовить окружение
			поставить electron
			инициировать npm пакет
			создавть стартовый скрипт	
	2.	обработка нажатия клавиши shift
	3.	при запуске запрашивать количество клиентов
	4.	сброс количества клиентов в настройках
	5.	добавление кружков через настройки
	6.	сохранение количества и параметров устройств
	7.	отрисовка количества кружков в соответствие с конфигом
	8.	перетаскивание кружков серверов
 	9.	отработка нажатия

 	10.	поднятие udp сервера (15m)
 	11	эмулятор клиента 			
 	12.	получение сообщений от клиента
 	13.	динамическое создание клиентов
 			при получение udp пакета проверяем есть ли клиент с таким id и если нет
 				то создаём и отправляем на отображение
 	14.	привязка клиента к индикатору (с сохранением)
 	15.	отображение id, ip
 	16.	отображение текущего состояния круга сообщение которое он шлет в ЦУ.
 	
 	17.	статус подключен после каждого сообщения
 	18.	статус отключен по таймауту с последнего сообщения  
 	19.	индикация зелёным
 	20.	настройка порога срабатывания и офлайн таймера в настройках
 			отображение полей параметров в окне
 			чтение параметров и применение параметров по умолчанию
 			принятие и сохранение новых параметров
 			использование параметров
 	21.	генерация цвета в цикле
 	22.	перенести проверку подключен клиент или нет в main

 	23.	функция отправки команды клиенту (всем или с конкретным id)
 	24.	отображение текущего цвета кругами
 	25.	обработка нажатия на круг - отправка белого цвета
 	26.	индикация сработки белым цветом
 	27.	отправка по нажатию клиенту команды цвета (белый)
 	28.	проверка входящего значения от клиента и если больше порога - отправка команды цвета
 	
 	29.	номера вселенных всегда 1 и 2, т.е. без привязки к id
 	30.	круг модуля не становится серым по offine таймоту
 	31.	ошибка при смене статуса потерянного модуля	
 	32.	вынести куски кода в отдельные модули


	.	отправка сервером раз в 5 секунд broadcast udp пакета содержащее слово hello.
		клиенты слушают эти сообщения и при получение начинают слать своё состояние на ip сервера.
	.	определить порты
			5568 - пакеты с цветами для модулей	
			5567 - broadcast сервера с hello
			3000 - состояние сенсора модуля

	.	убрать окно настроек, а его содержимое вынести в правую часть основного окна
			будет содержать две части
				общие - то что уже есть + fps
				отображение состояния выбранного модуля

</pre>