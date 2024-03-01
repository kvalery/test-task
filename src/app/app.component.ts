import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, takeUntil, timer } from 'rxjs';

/** Тестовое задание:
 Допустим, у нас есть поле для ввода логина и кнопка "Отправить". При нажатии на нее идет запрос на сервер, на это время кнопка будет заблокирована.
 При успешном логине мы выведем имя пользователя ниже, в противном случае покажем ошибку на 5 секунд.
 Повторная отправка логина возможно только через 1 минуту, нужно добавить таймер, ведущий отсчет перед повторной отправкой логина.
 Проект сделать на фреймворке Angular, разместить в гитхаб и прислать ссылку на репозиторий
 *
 решил тесовое задание, добавил эмуляцию отрицательного ответа на попытку ввести не верный логин (ошибка от сервера)
 таймер отображается под полем ввода, не добавлял transition, немного причесал макет, использовал дефолтные состояния
 *
 * */

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  /** логин, актуальный логин для шаблона */
  public login = '';

  /** таймер, представление для шаблона */
  public timer = 0;

  /** форма ввода */
  public loginForm: FormGroup;

  /** загрузка данных, состояние дизейбла */
  public loading = false;

  /** состояние дизейбла */
  public delayError = false;

  /** ошибка запроса */
  public showError = false;

  /** каунтер для получения ошибки */
  private _errCounter = 0;

  /** таймер RXjs */
  private _timer$: Subscription;

  /** перемена для массовой отписки */
  private _massDestroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private _formBuilder: FormBuilder,
    private _http: HttpClient
  ) {}

  ngOnInit() {
    // инициализация работы формы
    this._formInit();
  }

  ngOnDestroy() {
    // массовая отписка
    this._massDestroy$.next(true);
    this._massDestroy$.unsubscribe();
  }

  /** отправка формы */
  public onSubmit(): void {
    // проверка формы и возможности отправки формы
    if (this.loading || this.delayError || this.loginForm.invalid) return
    this._loadData()
  }

  /** загрузка данных, проверка логина  */
  private _loadData(): void {
    // отображаем лоудер
    this.loading = true;

    // сбрасываем логин в шаблоне
    this.login = '';

    // урл API
    let url = 'https://randomuser.me/api/';

    // для примера обработки ошибки
    // каждый второй раз ломаем url
    if ((this._errCounter % 2) > 0) {
      url = url.split('').reverse().join('')
    }
    // увеличиваем значение каунтера,
    // для четных значений ломаем url и отправляем запрос с ошибкой
    this._errCounter++

    this._http.get(url)
      .pipe(takeUntil(this._massDestroy$))
      .subscribe(
        (res: unknown) => {
          // логин введен верно
          this.login = this.loginForm.get('login')?.value;
          this.loading = false;
        },
        (err) => {
          // обработка ошибки
          this.loginForm.get('login')?.setValue('');
          this._showErrorDelay();
          this.loading = false;
        }
      );
  }

  /** инициализация задержки
   * и отображение ошибки
   * */
  private _showErrorDelay(): void {
    this.showError = true;
    this.delayError = true;
    this.loginForm.controls['login'].disable();

    this._timer$ = timer(0, 1000)
      .pipe(takeUntil(this._massDestroy$))
      .subscribe(
        (t) => {
          // через 5 секунд убираем оповещение об ошибке
          if (t === 5) {
            this.showError = false;
          }
          // окончание работы таймера
          if (t === 60) {
            this._spotErrorDelay()
          }
          // обновляем отображение таймера
          this.timer = 60 - t;
        }
      )
  }

  /** останавливаем таймер, разрешаем использование формы */
  private _spotErrorDelay(): void {
    this.delayError = false;
    this.loginForm.controls['login'].enable();
    this._timer$.unsubscribe();
  }

  /** подготовка формы */
  private _formInit(): void {
    this.loginForm = this._formBuilder.group(
      {
        login: [null, [Validators.required]],
      },
    );
  }

}
