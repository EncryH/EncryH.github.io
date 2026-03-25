---
layout: single
title: "[Data structure] C로 구현한 단순 연결 리스트 삽입"
categories: C
tag: [C, Data structure, Linked List]
toc: true
toc_label: 목차
author_profile: false
---

# 1. 프로젝트 개요
자료구조 과목에서 C 언어 기반으로 단순 연결 리스트(Singly Linked List)를 구현하면서 세 가지 삽입 연산을 정리했다.

이번 실습에서 구현한 삽입 기능은 다음과 같다.

1. 첫 노드 삽입
2. 마지막 노드 삽입
3. 오름차순을 유지한 상태에서 삽입

배열 기반 선형 리스트와 달리 연결 리스트는 포인터를 이용해 노드를 연결하므로, 특정 위치에 원소를 삽입할 때 전체 데이터를 한 칸씩 밀어내지 않아도 된다는 특징이 있다.

# 2. 구조체 설계
연결 리스트는 노드(Node)와 리스트(List) 구조체로 구성했다.

```c
typedef struct Node {
    int val;
    struct Node* next;
} Node;

typedef struct List {
    Node* head;
    int node_cnt;
} List;
```

각 구조체의 역할은 다음과 같다.

- `Node`는 실제 데이터(`val`)와 다음 노드를 가리키는 포인터(`next`)를 가진다.
- `List`는 연결 리스트의 시작 주소인 `head`와 전체 노드 개수인 `node_cnt`를 저장한다.

# 3. 초기화와 노드 생성
리스트를 사용하기 전에 반드시 초기화해야 하며, 노드는 동적 할당을 통해 생성한다. 아래 코드는 과제에서 사용한 원본 코드 그대로이다.

```c
// 초기화
void list_init(List* list) {
	list->head = NULL;
	list->node_cnt = 0;
}

Node* createNode(void) {
	int num = 0;
	num = rand() % 100;
	Node* New_node = (Node*)malloc(sizeof(Node));
	New_node->val = num;
	New_node->next = NULL;

	return New_node;
}
```

이 구현에서는 `rand()`를 이용해 0부터 99 사이의 정수를 만들고, 이를 새 노드의 값으로 저장했다.

# 4. 리스트 출력
삽입 결과가 잘 반영되는지 확인하기 위해 리스트 전체를 순회하며 출력하는 함수를 사용했다.

```c
void list_print(List* list) {
	if (list == NULL) {
		printf("list is not exist!\n");
		return;
	}

	Node* tmp = list->head;

	while (tmp != NULL) {
		printf("%2d - ", tmp->val);
		tmp = tmp->next;
	}
	printf("\n");
}
```

이 함수는 `head`부터 시작해서 `next`를 따라가며 모든 노드의 값을 출력한다. 연결 리스트는 배열처럼 인덱스로 접근할 수 없기 때문에 이런 순회 과정이 기본이 된다.

# 5. 삽입 연산 구현
## 5-1. 첫 노드 삽입
가장 앞에 노드를 삽입하는 방식은 가장 단순하다. 새 노드의 `next`가 기존 `head`를 가리키게 한 뒤, `head`를 새 노드로 바꾸면 된다.

```c
int list_append_first(List* list, Node* node) {
	Node* New_node;
	//New_node = (Node*)malloc(sizeof(Node));
	// New_node->val = list;

	node->next = list->head;
	list->head = node;

	// 카운트
	list->node_cnt++;
	return list->node_cnt;
}
```

이 방식은 별도의 탐색이 필요하지 않기 때문에 시간 복잡도는 `O(1)`이다.

## 5-2. 마지막 노드 삽입
마지막 삽입은 리스트 끝까지 이동한 뒤 마지막 노드의 `next`에 새 노드를 연결해야 한다.

```c
int list_append_last(List* list, Node* node) {
	Node* tmp;
	tmp = list->head;

	if (list->head == NULL) {
		node->next = NULL;
		list->head = node;
		list->node_cnt++;
		return list->node_cnt;
	}
	else {
		tmp = list->head;

		while (tmp->next != NULL) {
			tmp = tmp->next;
			list->node_cnt++;
		}
		node->next = NULL;
		tmp->next = node;
	}

	return list->node_cnt;
}
```

리스트가 비어 있지 않은 경우 마지막 노드를 찾기 위해 전체를 순회해야 하므로 시간 복잡도는 `O(n)`이다.

## 5-3. 오름차순 유지 삽입
정렬된 상태를 유지하면서 삽입하려면 새 노드가 들어갈 위치를 찾아야 한다.

```c
int list_append_ordered(List* list, Node* node) {
	Node* tmp;
	tmp = list->head;

	if (!tmp || node->val < tmp->val) {
		node->next = tmp;
		list->head = node;
	}
	else {
		while (tmp->next && tmp->next->val < node->val)
			tmp = tmp->next;

		node->next = tmp->next;
		tmp->next = node;

	}
	list->node_cnt++;
	
	return list->node_cnt;
}
```

이 함수는 다음 두 가지 경우로 나누어 생각할 수 있다.

1. 리스트가 비어 있거나 새 값이 가장 작은 경우
2. 중간 또는 마지막 위치에 삽입해야 하는 경우

두 번째 경우에는 `tmp->next->val`과 새 노드 값을 비교하면서 삽입 지점을 찾는다. 위치를 찾은 뒤에는 포인터 두 개만 변경하면 되므로 연결 자체는 간단하지만, 위치 탐색 때문에 시간 복잡도는 `O(n)`이다.

# 6. 전체 코드
아래는 과제에서 사용한 원본 코드 전체이다.

```c
#define _CRT_SECURE_NO_WARNINGS
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <time.h>

// 구조체 정의
typedef struct Node {
	int val;
	struct Node* next;
} Node;

typedef struct List {
	Node* head;
	int node_cnt;
} List;

// 초기화
void list_init(List* list) {
	list->head = NULL;
	list->node_cnt = 0;
}

Node* createNode(void) {
	int num = 0;
	num = rand() % 100;
	Node* New_node = (Node*)malloc(sizeof(Node));
	New_node->val = num;
	New_node->next = NULL;

	return New_node;
}

void list_print(List* list) {
	if (list == NULL) {
		printf("list is not exist!\n");
		return;
	}

	Node* tmp = list->head;

	while (tmp != NULL) {
		printf("%2d - ", tmp->val);
		tmp = tmp->next;
	}
	printf("\n");
}

// 첫 지점 삽입
int list_append_first(List* list, Node* node) {
	Node* New_node;
	//New_node = (Node*)malloc(sizeof(Node));
	// New_node->val = list;

	node->next = list->head;
	list->head = node;

	// 카운트
	list->node_cnt++;
	return list->node_cnt;
}

// 마지막 지점 삽입
int list_append_last(List* list, Node* node) {
	Node* tmp;
	tmp = list->head;

	if (list->head == NULL) {
		node->next = NULL;
		list->head = node;
		list->node_cnt++;
		return list->node_cnt;
	}
	else {
		tmp = list->head;

		while (tmp->next != NULL) {
			tmp = tmp->next;
			list->node_cnt++;
		}
		node->next = NULL;
		tmp->next = node;
	}

	return list->node_cnt;
}

// 오름차순을 유지한 상태로 새로운 노드 값을 삽입
int list_append_ordered(List* list, Node* node) {
	Node* tmp;
	tmp = list->head;

	if (!tmp || node->val < tmp->val) {
		node->next = tmp;
		list->head = node;
	}
	else {
		while (tmp->next && tmp->next->val < node->val)
			tmp = tmp->next;

		node->next = tmp->next;
		tmp->next = node;

	}
	list->node_cnt++;
	
	return list->node_cnt;
}

int main() {
	int i = 0;

	srand(time(NULL));

	List list;
	list_init(&list);

	for (i = 0; i < 10; i++) {
		Node* node = createNode();

		int ret = list_append_ordered(&list, node);
		
		printf("val : %d, ret : %d\n", node->val, ret);
		

		list_print(&list);
	}
	return 0;
}
```

# 7. 시간 복잡도 정리
각 삽입 연산의 시간 복잡도는 다음과 같다.

- 첫 노드 삽입: `O(1)`
- 마지막 노드 삽입: `O(n)`
- 오름차순 유지 삽입: `O(n)`

즉, 연결 리스트는 앞쪽 삽입에는 매우 효율적이지만 마지막 삽입이나 정렬 삽입처럼 탐색이 필요한 경우에는 선형 시간이 필요하다.

# 8. 느낀 점과 개선 방향
이번 구현을 통해 단순 연결 리스트에서 핵심은 데이터 자체보다도 포인터 연결 순서를 정확히 유지하는 것이라는 점을 확인할 수 있었다.

특히 오름차순 삽입은 단순히 값을 넣는 것이 아니라 삽입 위치를 먼저 찾고, 이전 노드와 다음 노드 사이에 새 노드를 안전하게 연결해야 하므로 포인터 조작에 대한 이해가 중요했다.

추가로 보완할 수 있는 부분은 다음과 같다.

- 프로그램 종료 전 전체 노드를 `free()`하는 메모리 해제 함수 추가
- 사용자가 직접 삽입 방식을 선택할 수 있는 메뉴 기반 프로그램으로 확장
- `tail` 포인터를 추가해 마지막 삽입 시간을 `O(1)`로 개선

# 9. 정리
이번 실습에서는 C 언어로 단순 연결 리스트를 직접 구현하고, 첫 삽입, 마지막 삽입, 오름차순 유지 삽입까지 단계적으로 작성했다.

배열 기반 자료구조와 비교했을 때 연결 리스트는 삽입 시 데이터 이동이 필요 없다는 장점이 있지만, 원하는 위치를 찾기 위해 순차 탐색이 필요하다는 점도 함께 확인할 수 있었다.

자료구조 수업에서 배운 연결 리스트의 기본 원리를 코드로 직접 구현해 보면서, 포인터 기반 자료구조를 다루는 감각을 익힐 수 있었던 실습이었다.
